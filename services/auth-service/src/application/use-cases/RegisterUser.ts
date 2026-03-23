import bcrypt from 'bcryptjs'
import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { IUserServiceClient } from '../../domain/interfaces/IUserServiceClient'
import { IWorkerServiceClient } from '../../domain/interfaces/IWorkerServiceClient'
import { RegisterRequestDto, RegisterResponseDto } from '../dtos/AuthDto'

export class RegisterUser {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly userServiceClient: IUserServiceClient,
    private readonly workerServiceClient: IWorkerServiceClient
  ) {}

  async execute(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    // 1. Check duplicate email
    const existing = await this.authRepo.findByEmail(dto.email)
    if (existing) {
      const err = new Error('Email already in use')
      ;(err as any).status = 409
      throw err
    }

    // 2. Hash password — cost 12 is secure, not too slow
    const passwordHash = await bcrypt.hash(dto.password, 12)

    const role = (dto.role ?? 'USER').toUpperCase()

    // 3. Save credentials to auth_db — ONLY what Auth owns
    const user = await this.authRepo.create({
      email: dto.email,
      passwordHash,
      role,
    })

    // 4. Notify User Service to create the profile record
    // Non-blocking — if User Service is down, auth still succeeds
    // When Kafka is added, this becomes: producer.publish('user.registered', payload)
    await this.userServiceClient.createProfile({
      userId: user.id,
      email:  user.email,
      role:   user.role,
    })

    // 5. Worker Service — persist workers row (same id as auth user) when role is WORKER
    if (role === 'WORKER') {
      await this.workerServiceClient.createWorkerProfile({
        userId:           user.id,
        email:            user.email,
        name:             dto.name,
        phone:            dto.phone,
        avatar:           dto.avatar,
        bio:              dto.bio,
        experienceYears:  dto.experienceYears,
        availability:     dto.availability,
      })
    }

    return {
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
