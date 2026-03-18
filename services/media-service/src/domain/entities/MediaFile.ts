export type MediaType = 'IMAGE' | 'VIDEO'

export interface MediaFileEntity {
  id:         string
  ownerId:    string
  s3Key:      string
  cdnUrl:     string
  fileName:   string
  mimeType:   string
  sizeBytes:  number
  mediaType:  MediaType
  isAttached: boolean
  uploadedAt: Date
}
