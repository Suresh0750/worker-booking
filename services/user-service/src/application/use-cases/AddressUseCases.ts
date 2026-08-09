import { HttpStatus } from '../../domain/enums/HttpStatus'
import { IAddressRepository } from '../../domain/interfaces/IAddressRepository'
import { UpdateAddressDto, AddressResponseDto } from '../dtos/UserDto'

// ── Update Address ────────────────────────────────────────
export class UpdateAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(
    addressId: string,
    userId: string,
    dto: UpdateAddressDto
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepo.findById(addressId)

    if (!address) {
      const err = new Error('Address not found')
      ;(err as any).status = HttpStatus.NOT_FOUND
      throw err
    }

    // Make sure user owns this address
    if (address.userId !== userId) {
      const err = new Error('Forbidden')
      ;(err as any).status = HttpStatus.FORBIDDEN
      throw err
    }

    const updated = await this.addressRepo.update(addressId, dto)

    return {
      id:        updated.id,
      userId:    updated.userId,
      line1:     updated.line1,
      line2:     updated.line2,
      city:      updated.city,
      state:     updated.state,
      pincode:   updated.pincode,
      lat:       updated.lat,
      lng:       updated.lng,
      isPrimary: updated.isPrimary,
    }
  }
}

// ── Set Primary Address ───────────────────────────────────
export class SetPrimaryAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId)

    if (!address) {
      const err = new Error('Address not found')
      ;(err as any).status = HttpStatus.NOT_FOUND
      throw err
    }

    if (address.userId !== userId) {
      const err = new Error('Forbidden')
      ;(err as any).status = HttpStatus.FORBIDDEN
      throw err
    }

    await this.addressRepo.setPrimary(addressId, userId)
  }
}

// ── Delete Address ────────────────────────────────────────
export class DeleteAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId)

    if (!address) {
      const err = new Error('Address not found')
      ;(err as any).status = HttpStatus.NOT_FOUND
      throw err
    }

    if (address.userId !== userId) {
      const err = new Error('Forbidden')
      ;(err as any).status = HttpStatus.FORBIDDEN
      throw err
    }

    if (address.isPrimary) {
      const err = new Error('Cannot delete primary address. Set another address as primary first.')
      ;(err as any).status = HttpStatus.BAD_REQUEST
      throw err
    }

    await this.addressRepo.delete(addressId)
  }
}
