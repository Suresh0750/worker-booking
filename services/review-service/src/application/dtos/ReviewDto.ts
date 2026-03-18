// ── Request DTOs ──────────────────────────────────────────
export interface SubmitReviewDto {
  bookingId: string
  rating:    number   // 1 to 5
  comment?:  string
}

export interface GetReviewsDto {
  page?:  number
  limit?: number
}

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
