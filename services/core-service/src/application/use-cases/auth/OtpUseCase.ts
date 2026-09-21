import crypto from 'crypto'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { IOtpRepository } from '@domain/interfaces/IOtpRepository'
import { IOtpDeliveryService } from '@domain/interfaces/IOtpDeliveryService'
import { OtpPurpose } from '@domain/entities/Otp'
import { logger } from '@infrastructure/config/logger'
import { SendOtpInput, VerifyOtpInput } from '../../schemas/AuthSchemas'
import { SendOtpResponseDto, VerifyOtpResponseDto } from '../../dtos/AuthDto'

const OTP_TTL_SECONDS  = parseInt(process.env.OTP_TTL_SECONDS  ?? '300', 10)
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5',   10)
const OTP_LENGTH       = 6

export class OtpUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly otpRepo:  IOtpRepository,
    private readonly delivery: IOtpDeliveryService,
  ) {}

  async send(dto: SendOtpInput): Promise<SendOtpResponseDto> {
    const isEmail  = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION'
    const channel  = isEmail ? 'EMAIL' : 'SMS'

    // Block if identifier is already registered
    const exists = isEmail
      ? await this.authRepo.findByEmail(identifier)
      : await this.authRepo.findByPhone(identifier)

    if (exists) {
      this.fail(
        HttpStatus.BAD_REQUEST,
        isEmail ? 'Email address already registered' : 'Phone number already registered',
      )
    }

    const code     = crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')

    await this.otpRepo.save({
      identifier,
      channel:     channel as any,
      purpose,
      codeHash,
      expiresAt:   new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      maxAttempts: OTP_MAX_ATTEMPTS,
    })

    try {
      if (isEmail) await this.delivery.sendEmailOtp(identifier, code)
      else         await this.delivery.sendSmsOtp(identifier, code)
    } catch (err: any) {
      logger.error(`Failed to deliver OTP via ${channel} to ${identifier}: ${err.message}`)
    }

    return {
      sent:      true,
      expiresIn: OTP_TTL_SECONDS,
      ...(process.env.NODE_ENV === 'development' ? { debugCode: code } : {}),
    }
  }

  async verify(dto: VerifyOtpInput): Promise<VerifyOtpResponseDto> {
    const isEmail    = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION'

    const record = await this.otpRepo.findLatestByIdentifierAndPurpose(identifier, purpose)

    if (!record)                                    this.fail(HttpStatus.BAD_REQUEST, 'No OTP found for this identifier')
    if (record!.verifiedAt)                         this.fail(HttpStatus.BAD_REQUEST, 'OTP already verified')
    if (record!.expiresAt.getTime() < Date.now())   this.fail(HttpStatus.BAD_REQUEST, 'OTP has expired. Request a new one')
    if (record!.attempts >= record!.maxAttempts)    this.fail(HttpStatus.TOO_MANY_REQUESTS, 'Too many failed attempts. Request a new OTP')

    const hash = crypto.createHash('sha256').update(dto.otp).digest('hex')
    if (hash !== record!.codeHash) {
      await this.otpRepo.incrementAttempts(record!.id)
      this.fail(HttpStatus.BAD_REQUEST, 'Invalid OTP')
    }

    await this.otpRepo.markVerified(record!.id)
    return { verified: true }
  }

  private fail(status: number, message: string): never {
    const err = new Error(message) as Error & { status?: number }
    err.status = status
    throw err
  }
}
