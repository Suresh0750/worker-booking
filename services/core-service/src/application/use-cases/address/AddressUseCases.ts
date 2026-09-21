import { HttpStatus } from '@domain/enums/HttpStatus'
import { IAddressRepository } from '@domain/interfaces/IAddressRepository'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { CreateAddressInput, UpdateAddressInput } from '../../schemas/UserSchemas'
import { AddressResponseDto } from '../../dtos/UserDto'

// ── helpers ───────────────────────────────────────────────
function toDto(a: any): AddressResponseDto {
  return {
    id:        a.id,
    userId:    a.userId,
    line1:     a.line1,
    line2:     a.line2,
    city:      a.city,
    state:     a.state,
    pincode:   a.pincode,
    lat:       a.lat !== null ? Number(a.lat) : null,
    lng:       a.lng !== null ? Number(a.lng) : null,
    label:     a.label,
    isPrimary: a.isPrimary,
  }
}

function appError(status: number, message: string): never {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  throw err
}

// ── Add Address ───────────────────────────────────────────
export class AddAddress {
  constructor(
    private readonly addressRepo: IAddressRepository,
    private readonly userRepo:    IUserRepository,
  ) {}

  async execute(userId: string, dto: CreateAddressInput): Promise<AddressResponseDto> {
    const user = await this.userRepo.findById(userId)
    if (!user) appError(HttpStatus.NOT_FOUND, 'User not found')

    const existing     = await this.addressRepo.findByUserId(userId)
    const shouldBePrimary = dto.isPrimary ?? existing.length === 0

    const address = await this.addressRepo.create({
      ...dto,
      userId,
      isPrimary: shouldBePrimary,
    })

    return toDto(address)
  }
}

// ── Get Addresses ─────────────────────────────────────────
export class GetAddresses {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepo.findByUserId(userId)
    return addresses.map(toDto)
  }
}

// ── Update Address ────────────────────────────────────────
export class UpdateAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(
    addressId: string,
    userId: string,
    dto: UpdateAddressInput,
  ): Promise<AddressResponseDto> {
    const address = await this.addressRepo.findById(addressId)
    if (!address)               appError(HttpStatus.NOT_FOUND,  'Address not found')
    if (address!.userId !== userId) appError(HttpStatus.FORBIDDEN, 'Forbidden')

    const updated = await this.addressRepo.update(addressId, dto)
    return toDto(updated)
  }
}

// ── Set Primary Address ───────────────────────────────────
export class SetPrimaryAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId)
    if (!address)               appError(HttpStatus.NOT_FOUND,  'Address not found')
    if (address!.userId !== userId) appError(HttpStatus.FORBIDDEN, 'Forbidden')

    await this.addressRepo.setPrimary(addressId, userId)
  }
}

// ── Delete Address ────────────────────────────────────────
export class DeleteAddress {
  constructor(private readonly addressRepo: IAddressRepository) {}

  async execute(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId)
    if (!address)               appError(HttpStatus.NOT_FOUND,  'Address not found')
    if (address!.userId !== userId) appError(HttpStatus.FORBIDDEN, 'Forbidden')

    if (address!.isPrimary) {
      appError(
        HttpStatus.BAD_REQUEST,
        'Cannot delete primary address. Set another address as primary first.',
      )
    }

    await this.addressRepo.delete(addressId)
  }
}
