import { prisma } from '../config/prisma'
import {
  IAddressRepository,
  CreateAddressInput,
  UpdateAddressInput,
} from '@domain/interfaces/IAddressRepository'
import { AddressEntity } from '@domain/entities/Address'
import { toAddressEntity } from './mappers'

export class PrismaAddressRepository implements IAddressRepository {

  async findById(id: string): Promise<AddressEntity | null> {
    const a = await prisma.address.findUnique({ where: { id } })
    return a ? toAddressEntity(a) : null
  }

  async findByUserId(userId: string): Promise<AddressEntity[]> {
    const rows = await prisma.address.findMany({
      where:   { userId },
      orderBy: { isPrimary: 'desc' }, // primary address first
    })
    return rows.map(toAddressEntity)
  }

  async findPrimary(userId: string): Promise<AddressEntity | null> {
    const a = await prisma.address.findFirst({
      where: { userId, isPrimary: true },
    })
    return a ? toAddressEntity(a) : null
  }

  async create(data: CreateAddressInput): Promise<AddressEntity> {
    const a = await prisma.address.create({
      data: {
        userId:    data.userId,
        line1:     data.line1,
        line2:     data.line2,
        city:      data.city,
        state:     data.state,
        pincode:   data.pincode,
        lat:       data.lat,
        lng:       data.lng,
        label:     data.label,
        isPrimary: data.isPrimary ?? false,
      },
    })
    return toAddressEntity(a)
  }

  async update(id: string, data: UpdateAddressInput): Promise<AddressEntity> {
    const a = await prisma.address.update({
      where: { id },
      data: {
        ...(data.line1   !== undefined && { line1:   data.line1 }),
        ...(data.line2   !== undefined && { line2:   data.line2 }),
        ...(data.city    !== undefined && { city:    data.city }),
        ...(data.state   !== undefined && { state:   data.state }),
        ...(data.pincode !== undefined && { pincode: data.pincode }),
        ...(data.lat     !== undefined && { lat:     data.lat }),
        ...(data.lng     !== undefined && { lng:     data.lng }),
        ...(data.label   !== undefined && { label:   data.label }),
      },
    })
    return toAddressEntity(a)
  }

  async setPrimary(id: string, userId: string): Promise<void> {
    // Unset all, then set the selected one — two queries in sequence
    await prisma.address.updateMany({ where: { userId }, data: { isPrimary: false } })
    await prisma.address.update({ where: { id }, data: { isPrimary: true } })
  }

  async delete(id: string): Promise<void> {
    await prisma.address.delete({ where: { id } })
  }
}

export default new PrismaAddressRepository()
