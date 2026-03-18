import { prisma } from '../config/prisma'
import {
  IAddressRepository,
  CreateAddressInput,
  UpdateAddressInput,
} from '../../domain/interfaces/IAddressRepository'
import { AddressEntity } from '../../domain/entities/User'

export class PrismaAddressRepository implements IAddressRepository {
  async findById(id: string): Promise<AddressEntity | null> {
    return prisma.address.findUnique({ where: { id } }) as Promise<AddressEntity | null>
  }

  async findByUserId(userId: string): Promise<AddressEntity[]> {
    return prisma.address.findMany({
      where:   { userId },
      orderBy: { isPrimary: 'desc' }, // Primary address comes first
    }) as Promise<AddressEntity[]>
  }

  async findPrimary(userId: string): Promise<AddressEntity | null> {
    return prisma.address.findFirst({
      where: { userId, isPrimary: true },
    }) as Promise<AddressEntity | null>
  }

  async create(data: CreateAddressInput): Promise<AddressEntity> {
    return prisma.address.create({
      data: {
        userId:    data.userId,
        line1:     data.line1,
        line2:     data.line2,
        city:      data.city,
        state:     data.state,
        pincode:   data.pincode,
        lat:       data.lat,
        lng:       data.lng,
        isPrimary: data.isPrimary ?? false,
      },
    }) as Promise<AddressEntity>
  }

  async update(id: string, data: UpdateAddressInput): Promise<AddressEntity> {
    return prisma.address.update({
      where: { id },
      data,
    }) as Promise<AddressEntity>
  }

  async setPrimary(id: string, userId: string): Promise<void> {
    // Unset all primary addresses for this user first
    await prisma.address.updateMany({
      where: { userId },
      data:  { isPrimary: false },
    })
    // Set the selected one as primary
    await prisma.address.update({
      where: { id },
      data:  { isPrimary: true },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({ where: { id } })
  }
}
