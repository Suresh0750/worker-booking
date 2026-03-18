import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { UpdateProfileDto, UserResponseDto } from '../dtos/UserDto'

export class UpdateProfile {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      ;(err as any).status = 404
      throw err
    }

    const updated = await this.userRepo.update(userId, dto)

    return {
      id:        updated.id,
      email:     updated.email,
      name:      updated.name,
      phone:     updated.phone,
      avatar:    updated.avatar,
      role:      updated.role,
      createdAt: updated.createdAt,
    }
  }
}
