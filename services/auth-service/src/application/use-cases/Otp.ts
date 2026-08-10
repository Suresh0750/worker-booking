import crypto from 'crypto'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { IOtpDeliveryService } from '../../domain/interfaces/IOtpDeliveryService'
import { IOtpRepository } from '../../domain/interfaces/IOtpRepository'
import { OtpPurpose } from '../../domain/entities/Otp'
import { logger } from '../../infrastructure/config/logger'

const OTP_TTL_SECONDS = parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10)
const OTP_LENGTH = 6
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS ?? '5', 10)

export interface SendOtpRequest {
  email?: string
  phone?: string
}

export interface SendOtpResult {
  sent: boolean
  expiresIn: number
  debugCode?: string
}

export interface VerifyOtpRequest {
  email?: string
  phone?: string
  otp: string
}

export interface VerifyOtpResult {
  verified: boolean
}

export class Otp {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly otpRepo: IOtpRepository,
    private readonly delivery: IOtpDeliveryService
  ) {}

  async send(dto: SendOtpRequest): Promise<SendOtpResult> {
    const isEmail = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION'
    const channel = isEmail ? 'EMAIL' : 'SMS'

    const account = isEmail
      ? await this.authRepo.findByEmail(identifier)
      : await this.authRepo.findByPhone(identifier)

    if (account) {
      this.fail(
        HttpStatus.BAD_REQUEST,
        isEmail ? 'Email address already exist' : 'Phone number already exist'
      )
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(OTP_LENGTH, '0')
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')

    await this.otpRepo.save({
      identifier,
      channel,
      purpose,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      maxAttempts: OTP_MAX_ATTEMPTS,
    })

    try {
      if (isEmail) await this.delivery.sendEmailOtp(identifier, code)
      else await this.delivery.sendSmsOtp(identifier, code)
    } catch (err: any) {
      logger.error(`Failed to deliver OTP via ${channel} to ${identifier}: ${err.message}`)
    }

    const debugCode = process.env.NODE_ENV === 'development' ? code : undefined

    return {
      sent: true,
      expiresIn: OTP_TTL_SECONDS,
      ...(debugCode ? { debugCode } : {}),
    }
  }

  async verify(dto: VerifyOtpRequest): Promise<VerifyOtpResult> {
    const isEmail = Boolean(dto.email)
    const identifier = (isEmail ? dto.email : dto.phone) as string
    const purpose: OtpPurpose = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION'

    const record = await this.otpRepo.findLatestByIdentifierAndPurpose(identifier, purpose)

    if (!record) {
      this.fail(HttpStatus.BAD_REQUEST, 'No OTP was requested for this email/phone')
    }
    if (record!.verifiedAt) {
      this.fail(HttpStatus.BAD_REQUEST, 'This OTP was already verified')
    }
    if (record!.expiresAt.getTime() < Date.now()) {
      this.fail(HttpStatus.BAD_REQUEST, 'OTP has expired. Request a new one')
    }
    if (record!.attempts >= record!.maxAttempts) {
      this.fail(HttpStatus.TOO_MANY_REQUESTS, 'Too many failed attempts. Request a new OTP')
    }

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

export default Otp
