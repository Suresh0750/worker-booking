import { prisma } from '../config/prisma'
import { IOtpRepository, CreateOtpInput } from '@domain/interfaces/IOtpRepository'
import { OtpEntity, OtpPurpose } from '@domain/entities/Otp'
import { toOtpEntity } from './mappers'

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
    purpose: OtpPurpose,
  ): Promise<OtpEntity | null> {
    const where =
  purpose === "PHONE_VERIFICATION"
    ? {
        identifier: {
          contains: identifier,
        },
        purpose,
      }
    : {
        identifier,
        purpose,
      };

    const record = await prisma.otp.findFirst({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
    return record ? toOtpEntity(record) : null
  }

  async markVerified(id: string): Promise<void> {
    await prisma.otp.update({ where: { id }, data: { verifiedAt: new Date() } })
  }

  async incrementAttempts(id: string): Promise<void> {
    await prisma.otp.update({ where: { id }, data: { attempts: { increment: 1 } } })
  }
}

export default new PrismaOtpRepository()
