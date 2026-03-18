import { IMediaRepository } from '../../domain/interfaces/IMediaRepository'
import { IS3Service }       from '../../domain/interfaces/IServiceInterfaces'
import { MediaResponseDto } from '../dtos/MediaDto'

// ── Delete media ──────────────────────────────────────────
export class DeleteMedia {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly s3Service: IS3Service,
  ) {}

  async execute(mediaId: string, workerId: string): Promise<void> {
    const media = await this.mediaRepo.findById(mediaId)

    if (!media) {
      const err = new Error('Media not found')
      ;(err as any).status = 404
      throw err
    }

    // Ownership check — worker can only delete their own files
    if (media.ownerId !== workerId) {
      const err = new Error('Forbidden — you do not own this file')
      ;(err as any).status = 403
      throw err
    }

    // Delete from S3 first, then remove DB record
    await this.s3Service.delete(media.s3Key)
    await this.mediaRepo.delete(mediaId)
  }
}

// ── Get all media for a worker ────────────────────────────
export class GetMyMedia {
  constructor(private readonly mediaRepo: IMediaRepository) {}

  async execute(workerId: string): Promise<MediaResponseDto[]> {
    const files = await this.mediaRepo.findByOwner(workerId)

    return files.map((m) => ({
      id:         m.id,
      ownerId:    m.ownerId,
      cdnUrl:     m.cdnUrl,
      fileName:   m.fileName,
      mimeType:   m.mimeType,
      sizeBytes:  m.sizeBytes,
      mediaType:  m.mediaType,
      isAttached: m.isAttached,
      uploadedAt: m.uploadedAt,
    }))
  }
}
