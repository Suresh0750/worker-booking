import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { CreateProfileDto, UserResponseDto } from '../dtos/UserDto'

// This use case is triggered by Auth Service after a user registers
// Auth calls POST /internal/users with eventType: "create_profile"
// When Kafka arrives → this becomes a consumer of "user.registered" topic
export class CreateProfile {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(dto: CreateProfileDto): Promise<UserResponseDto> {
    // Check if profile already exists — avoid duplicate on retry
    const existing = await this.userRepo.findById(dto.userId)
    if (existing) return this.toDto(existing)

    const user = await this.userRepo.create({
      id:    dto.userId,  // Use the same UUID from auth_db
      email: dto.email,
      role:  dto.role,
    })

    return this.toDto(user)
  }

  private toDto(user: any): UserResponseDto {
    return {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      phone:     user.phone,
      avatar:    user.avatar,
      role:      user.role,
      createdAt: user.createdAt,
    }
  }
}
