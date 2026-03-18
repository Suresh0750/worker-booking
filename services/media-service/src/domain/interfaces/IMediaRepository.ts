import { MediaFileEntity, MediaType } from '../entities/MediaFile'

export interface CreateMediaInput {
  ownerId:   string
  s3Key:     string
  cdnUrl:    string
  fileName:  string
  mimeType:  string
  sizeBytes: number
  mediaType: MediaType
}

export interface IMediaRepository {
  findById(id: string): Promise<MediaFileEntity | null>
  findByOwner(ownerId: string): Promise<MediaFileEntity[]>
  create(data: CreateMediaInput): Promise<MediaFileEntity>
  markAttached(id: string): Promise<void>
  delete(id: string): Promise<void>
}
