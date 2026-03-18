import bcrypt from 'bcryptjs'
import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { IUserServiceClient } from '../../domain/interfaces/IUserServiceClient'
import { RegisterRequestDto, RegisterResponseDto } from '../dtos/AuthDto'

export class RegisterUser {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly userServiceClient: IUserServiceClient
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

    // 3. Save credentials to auth_db — ONLY what Auth owns
    const user = await this.authRepo.create({
      email: dto.email,
      passwordHash,
      role:  (dto.role ?? 'USER').toUpperCase(),
    })

    // 4. Notify User Service to create the profile record
    // Non-blocking — if User Service is down, auth still succeeds
    // When Kafka is added, this becomes: producer.publish('user.registered', payload)
    await this.userServiceClient.createProfile({
      userId: user.id,
      email:  user.email,
      role:   user.role,
    })

    return {
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
