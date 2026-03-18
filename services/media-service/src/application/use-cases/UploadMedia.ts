import { v4 as uuid }         from 'uuid'
import { IMediaRepository }   from '../../domain/interfaces/IMediaRepository'
import { IS3Service }         from '../../domain/interfaces/IServiceInterfaces'
import { IWorkerClient }      from '../../domain/interfaces/IServiceInterfaces'
import { MediaResponseDto }   from '../dtos/MediaDto'
import { MediaType }          from '../../domain/entities/MediaFile'

export class UploadMedia {
  constructor(
    private readonly mediaRepo:    IMediaRepository,
    private readonly s3Service:    IS3Service,
    private readonly workerClient: IWorkerClient,
  ) {}

  async execute(
    workerId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<MediaResponseDto> {
    // 1. Determine media type from mime
    const mediaType: MediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE'

    // 2. Build a unique S3 key — folder/workerId/uuid.ext
    const ext      = file.originalname.split('.').pop() ?? 'bin'
    const folder   = mediaType === 'IMAGE' ? 'images' : 'videos'
    const fileName = `${uuid()}.${ext}`

    // 3. Upload to S3
    const { s3Key, cdnUrl } = await this.s3Service.upload(file, `${folder}/${workerId}`, fileName)

    // 4. Save record in media_db
    const media = await this.mediaRepo.create({
      ownerId:   workerId,
      s3Key,
      cdnUrl,
      fileName:  file.originalname,
      mimeType:  file.mimetype,
      sizeBytes: file.size,
      mediaType,
    })

    // 5. Notify Worker Service to attach to portfolio
    // Action-based: eventType "media_uploaded" → Kafka topic later
    await this.workerClient.attachPortfolio({
      workerId,
      mediaUrl:  cdnUrl,
      mediaType: mediaType.toLowerCase(),
      caption,
    })

    // 6. Mark as attached
    await this.mediaRepo.markAttached(media.id)

    return this.toDto({ ...media, isAttached: true })
  }

  private toDto(media: any): MediaResponseDto {
    return {
      id:         media.id,
      ownerId:    media.ownerId,
      cdnUrl:     media.cdnUrl,
      fileName:   media.fileName,
      mimeType:   media.mimeType,
      sizeBytes:  media.sizeBytes,
      mediaType:  media.mediaType,
      isAttached: media.isAttached,
      uploadedAt: media.uploadedAt,
    }
  }
}
