import crypto from 'crypto'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { IOtpRepository } from '@domain/interfaces/IOtpRepository'
import { IOtpDeliveryService } from '@domain/interfaces/IOtpDeliveryService'
import { OtpPurpose } from '@domain/entities/Otp'
import {
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
} from '@domain/errors/AppError'
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
    const isEmail    = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION'
    const channel  = isEmail ? 'EMAIL' : 'SMS'

    // Block if identifier is already registered
    const exists = isEmail
      ? await this.authRepo.findByEmail(identifier)
      : await this.authRepo.findByPhone(identifier)

    if (exists) {
      throw new BadRequestError(
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

  /**
   * Send an OTP to an already-registered email or phone (LOGIN purpose).
   * Used for post-login contact verification / 2-step confirmation.
   * Unlike `send()`, this does NOT block when the identifier is already registered.
   */
  async sendForRegistered(dto: SendOtpInput): Promise<SendOtpResponseDto> {
    const isEmail    = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const channel    = isEmail ? 'EMAIL' : 'SMS'

    // Require the identifier to exist
    const exists = isEmail
      ? await this.authRepo.findByEmail(identifier)
      : await this.authRepo.findByPhone(identifier)

    if (!exists) {
      throw new NotFoundError(
        isEmail ? 'No account with this email' : 'No account with this phone number',
      )
    }

    const code     = crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')

    await this.otpRepo.save({
      identifier,
      channel:     channel as any,
      purpose:     'LOGIN',
      codeHash,
      expiresAt:   new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      maxAttempts: OTP_MAX_ATTEMPTS,
    })

    try {
      if (isEmail) await this.delivery.sendEmailOtp(identifier, code)
      else         await this.delivery.sendSmsOtp(identifier, code)
    } catch (err: any) {
      logger.error(`Failed to deliver LOGIN OTP via ${channel} to ${identifier}: ${err.message}`)
    }

    return {
      sent:      true,
      expiresIn: OTP_TTL_SECONDS,
      ...(process.env.NODE_ENV === 'development' ? { debugCode: code } : {}),
    }
  }

  async verify(dto: VerifyOtpInput, purposeOverride?: OtpPurpose): Promise<VerifyOtpResponseDto> {
    const isEmail    = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = purposeOverride ?? (isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION')

    const record = await this.otpRepo.findLatestByIdentifierAndPurpose(identifier, purpose)

    if (!record)
      throw new BadRequestError('No OTP found for this identifier')
    if (record.verifiedAt)
      throw new BadRequestError('OTP already verified')
    if (record.expiresAt.getTime() < Date.now())
      throw new BadRequestError('OTP has expired. Request a new one')
    if (record.attempts >= record.maxAttempts)
      throw new TooManyRequestsError('Too many failed attempts. Request a new OTP')

    const hash = crypto.createHash('sha256').update(dto.otp).digest('hex')
    if (hash !== record.codeHash) {
      await this.otpRepo.incrementAttempts(record.id)
      throw new BadRequestError('Invalid OTP')
    }

    await this.otpRepo.markVerified(record.id)
    return { verified: true }
  }
}
