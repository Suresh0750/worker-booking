import { z } from 'zod'
import {
  submitReviewSchema,
  paginationSchema,
} from '../schemas/ReviewSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type SubmitReviewDto = z.infer<typeof submitReviewSchema>
export type GetReviewsDto   = z.infer<typeof paginationSchema>

// ── Response DTOs ─────────────────────────────────────────
export interface ReviewResponseDto {
  id:         string
  bookingId:  string
  workerId:   string
  userId:     string
  userName:   string | null
  workerName: string | null
  rating:     number
  comment:    string | null
  createdAt:  Date
}

export interface ReviewListDto {
  data:  ReviewResponseDto[]
  total: number
  page:  number
  limit: number
}

export interface WorkerRatingDto {
  workerId:     string
  avgRating:    number
  totalReviews: number
  breakdown: {
    star1: number
    star2: number
    star3: number
    star4: number
    star5: number
  }
}
