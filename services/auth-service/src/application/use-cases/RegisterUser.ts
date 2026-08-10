import bcrypt from 'bcryptjs'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { IOtpRepository } from '../../domain/interfaces/IOtpRepository'
import { IUserServiceClient } from '../../domain/interfaces/IUserServiceClient'
import { IWorkerServiceClient } from '../../domain/interfaces/IWorkerServiceClient'
import { RegisterRequestDto, RegisterResponseDto } from '../dtos/AuthDto'
import { IUserRole } from '../../domain/entities/User'

export class RegisterUser {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly userServiceClient: IUserServiceClient,
    private readonly workerServiceClient: IWorkerServiceClient,
    private readonly otpRepo: IOtpRepository
  ) {}

  async execute(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    // 1. Check duplicate email
    const existing = await this.authRepo.findByEmail(dto.email)
    if (existing) {
      const err = new Error('Email already in use')
      ;(err as any).status = HttpStatus.CONFLICT
      throw err
    }

    // 2. Require email & phone to be OTP-verified before account creation
    const emailOtp = await this.otpRepo.findLatestByIdentifierAndPurpose(dto.email, 'EMAIL_VERIFICATION')
    if (!emailOtp?.verifiedAt) {
      const err = new Error('Email is not verified. Please verify your email with the OTP first')
      ;(err as any).status = HttpStatus.BAD_REQUEST
      throw err
    }

    const phoneOtp = await this.otpRepo.findLatestByIdentifierAndPurpose(dto.phone, 'PHONE_VERIFICATION')
    if (!phoneOtp?.verifiedAt) {
      const err = new Error('Phone is not verified. Please verify your phone with the OTP first')
      ;(err as any).status = HttpStatus.BAD_REQUEST
      throw err
    }

    // 3. Hash password — cost 12 is secure, not too slow
    const passwordHash = await bcrypt.hash(dto.password, 12)

    const role = (dto.role ?? IUserRole.CUSTOMER).toUpperCase()

    // 4. Save credentials to auth_db — ONLY what Auth owns
    const user = await this.authRepo.create({
      email:        dto.email,
      passwordHash,
      role,
      fullName:     dto.fullName,
      phone:        dto.phone,
    })

    // // 5. Notify User Service to create the profile record
    // // Non-blocking — if User Service is down, auth still succeeds
    // // When Kafka is added, this becomes: producer.publish('user.registered', payload)
    // await this.userServiceClient.createProfile({
    //   userId: user.id,
    //   email:  user.email,
    //   role:   user.role,
    // })

    // // 6. Worker Service — persist workers row (same id as auth user) when role is WORKER
    // if (role === 'WORKER') {
    //   await this.workerServiceClient.createWorkerProfile({
    //     userId:           user.id,
    //     email:            user.email,
    //     name:             dto.fullName,
    //     phone:            dto.phone,
    //   })
    // }

    return {
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
