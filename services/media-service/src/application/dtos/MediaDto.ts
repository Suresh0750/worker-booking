import { z } from 'zod'
import { MediaType } from '../../domain/entities/MediaFile'
import { uploadMediaSchema } from '../schemas/MediaSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type UploadMediaDto = z.infer<typeof uploadMediaSchema>

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
