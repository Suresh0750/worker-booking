import { prisma }           from '../config/prisma'
import { IMediaRepository, CreateMediaInput } from '../../domain/interfaces/IMediaRepository'
import { MediaFileEntity }  from '../../domain/entities/MediaFile'

export class PrismaMediaRepository implements IMediaRepository {
  async findById(id: string): Promise<MediaFileEntity | null> {
    return prisma.mediaFile.findUnique({ where: { id } }) as Promise<MediaFileEntity | null>
  }

  async findByOwner(ownerId: string): Promise<MediaFileEntity[]> {
    return prisma.mediaFile.findMany({
      where:   { ownerId },
      orderBy: { uploadedAt: 'desc' },
    }) as Promise<MediaFileEntity[]>
  }

  async create(data: CreateMediaInput): Promise<MediaFileEntity> {
    return prisma.mediaFile.create({
      data: {
        ownerId:   data.ownerId,
        s3Key:     data.s3Key,
        cdnUrl:    data.cdnUrl,
        fileName:  data.fileName,
        mimeType:  data.mimeType,
        sizeBytes: data.sizeBytes,
        mediaType: data.mediaType as any,
      },
    }) as Promise<MediaFileEntity>
  }

  async markAttached(id: string): Promise<void> {
    await prisma.mediaFile.update({
      where: { id },
      data:  { isAttached: true },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.mediaFile.delete({ where: { id } })
  }
}
