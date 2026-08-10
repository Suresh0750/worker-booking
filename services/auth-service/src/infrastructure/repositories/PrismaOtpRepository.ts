import { Otp as PrismaOtp } from '@prisma/client'
import { prisma } from '../config/prisma'
import { OtpChannel, OtpEntity, OtpPurpose } from '../../domain/entities/Otp'
import { CreateOtpInput, IOtpRepository } from '../../domain/interfaces/IOtpRepository'

export function toOtpEntity(record: PrismaOtp): OtpEntity {
  return {
    id:          record.id,
    identifier:  record.identifier,
    channel:     record.channel as OtpChannel,
    purpose:     record.purpose as OtpPurpose,
    codeHash:    record.codeHash,
    expiresAt:   record.expiresAt,
    verifiedAt:  record.verifiedAt,
    attempts:    record.attempts,
    maxAttempts: record.maxAttempts,
    createdAt:   record.createdAt,
    updatedAt:   record.updatedAt,
  }
}

export class PrismaOtpRepository implements IOtpRepository {
  async save(data: CreateOtpInput): Promise<OtpEntity> {
    const record = await prisma.otp.create({
      data: {
        identifier:  data.identifier,
        channel:     data.channel,
        purpose:     data.purpose,
        codeHash:    data.codeHash,
        expiresAt:   data.expiresAt,
        maxAttempts: data.maxAttempts,
      },
    })
    return toOtpEntity(record)
  }

  async findLatestByIdentifierAndPurpose(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<OtpEntity | null> {
    const record = await prisma.otp.findFirst({
      where:   { identifier, purpose },
      orderBy: { createdAt: 'desc' },
    })
    return record ? toOtpEntity(record) : null
  }

  async markVerified(id: string): Promise<void> {
    await prisma.otp.update({ where: { id }, data: { verifiedAt: new Date() } })
  }

  async incrementAttempts(id: string): Promise<void> {
    await prisma.otp.update({ where: { id }, data: { attempts: { increment: 1 } } })
  }
}

const otpRepo = new PrismaOtpRepository()

export default otpRepo
