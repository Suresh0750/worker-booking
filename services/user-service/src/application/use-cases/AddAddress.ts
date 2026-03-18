import { IAddressRepository } from '../../domain/interfaces/IAddressRepository'
import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { CreateAddressDto, AddressResponseDto } from '../dtos/UserDto'

export class AddAddress {
  constructor(
    private readonly addressRepo: IAddressRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    // Verify user exists
    const user = await this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found')
      ;(err as any).status = 404
      throw err
    }

    // If this is set as primary, unset all other primary addresses first
    if (dto.isPrimary) {
      const existing = await this.addressRepo.findByUserId(userId)
      for (const addr of existing) {
        if (addr.isPrimary) {
          await this.addressRepo.update(addr.id, {})
        }
      }
    }

    // If user has no addresses yet, make this one primary automatically
    const existingAddresses = await this.addressRepo.findByUserId(userId)
    const shouldBePrimary = dto.isPrimary ?? existingAddresses.length === 0

    const address = await this.addressRepo.create({
      ...dto,
      userId,
      isPrimary: shouldBePrimary,
    })

    return this.toDto(address)
  }

  private toDto(address: any): AddressResponseDto {
    return {
      id:        address.id,
      userId:    address.userId,
      line1:     address.line1,
      line2:     address.line2,
      city:      address.city,
      state:     address.state,
      pincode:   address.pincode,
      lat:       address.lat,
      lng:       address.lng,
      isPrimary: address.isPrimary,
    }
  }
}
