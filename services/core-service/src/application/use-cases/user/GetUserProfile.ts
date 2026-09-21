import { HttpStatus } from '@domain/enums/HttpStatus'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { IAddressRepository } from '@domain/interfaces/IAddressRepository'
import { UserResponseDto, AddressResponseDto } from '../../dtos/UserDto'

export interface UserProfileWithAddresses extends UserResponseDto {
  addresses: AddressResponseDto[]
}

export class GetUserProfile {
  constructor(
    private readonly userRepo:    IUserRepository,
    private readonly addressRepo: IAddressRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileWithAddresses> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }

    const addresses = await this.addressRepo.findByUserId(userId)

    return {
      id:             user.id,
      fullName:       user.fullName,
      email:          user.email,
      phone:          user.phone,
      secondaryPhone: user.secondaryPhone,
      role:           user.role,
      gender:         user.gender,
      dob:            user.dob,
      profileImage:   user.profileImage,
      isBlocked:      user.isBlocked,
      createdAt:      user.createdAt,
      addresses:      addresses.map((a) => ({
        id:        a.id,
        userId:    a.userId,
        line1:     a.line1,
        line2:     a.line2,
        city:      a.city,
        state:     a.state,
        pincode:   a.pincode,
        lat:       a.lat,
        lng:       a.lng,
        label:     a.label,
        isPrimary: a.isPrimary,
      })),
    }
  }
}
