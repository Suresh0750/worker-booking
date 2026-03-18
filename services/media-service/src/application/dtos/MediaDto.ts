import { MediaType } from '../entities/MediaFile'

// ── Request DTOs ──────────────────────────────────────────
export interface UploadMediaDto {
  caption?: string
}

// ── Response DTOs ─────────────────────────────────────────
export interface MediaResponseDto {
  id:         string
  ownerId:    string
  cdnUrl:     string
  fileName:   string
  mimeType:   string
  sizeBytes:  number
  mediaType:  MediaType
  isAttached: boolean
  uploadedAt: Date
}
