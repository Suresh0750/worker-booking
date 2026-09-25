import bcrypt from 'bcryptjs'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { IOtpRepository } from '@domain/interfaces/IOtpRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { UserRole } from '@domain/entities/User'
import { BadRequestError, ConflictError } from '@domain/errors/AppError'
import { RegisterInput } from '../../schemas/AuthSchemas'
import { RegisterResponseDto } from '../../dtos/AuthDto'

export class RegisterUser {
  constructor(
    private readonly authRepo:   IAuthRepository,
    private readonly otpRepo:    IOtpRepository,
    private readonly workerRepo: IWorkerRepository,
  ) {}

  async execute(dto: RegisterInput): Promise<RegisterResponseDto> {
    // 1. Duplicate email check
    const existing = await this.authRepo.findByEmail(dto.email)
    if (existing) throw new ConflictError('Email already in use')

    // 2. Require verified email OTP
    const emailOtp = await this.otpRepo.findLatestByIdentifierAndPurpose(
      dto.email,
      'EMAIL_VERIFICATION',
    )
    if (!emailOtp?.verifiedAt) {
      throw new BadRequestError('Email is not verified. Please verify your email first')
    }

    const existPhone = await this.authRepo.findByPhone(dto.phone)
    if (existPhone) throw new ConflictError('Phone already in use')

    // 3. Require verified phone OTP
    const phoneOtp = await this.otpRepo.findLatestByIdentifierAndPurpose(
      dto.phone,
      'PHONE_VERIFICATION',
    )
    if (!phoneOtp?.verifiedAt) {
      throw new BadRequestError('Phone is not verified. Please verify your phone first')
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12)
    const role = (dto.role ?? UserRole.CUSTOMER).toUpperCase() as string

    // 5. Persist user — single DB write, no HTTP calls needed
    const user = await this.authRepo.create({
      fullName:     dto.fullName,
      email:        dto.email,
      phone:        dto.phone,
      passwordHash,
      role,
    })

    // 6. If WORKER, create worker profile in the same DB
    if (role === UserRole.WORKER) {
      await this.workerRepo.create({ userId: user.id })
    }

    return {
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
