import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { IAddressRepository } from '../../domain/interfaces/IAddressRepository'
import { UserResponseDto } from '../dtos/UserDto'

export class GetProfile {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly addressRepo: IAddressRepository
  ) {}

  async execute(userId: string): Promise<UserResponseDto & { addresses: any[] }> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      ;(err as any).status = 404
      throw err
    }

    const addresses = await this.addressRepo.findByUserId(userId)

    return {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      phone:     user.phone,
      avatar:    user.avatar,
      role:      user.role,
      createdAt: user.createdAt,
      addresses,
    }
  }
}
