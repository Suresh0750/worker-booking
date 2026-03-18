export interface ReviewEntity {
  id:         string
  bookingId:  string
  workerId:   string
  userId:     string
  userName:   string | null
  workerName: string | null
  rating:     number
  comment:    string | null
  isVisible:  boolean
  createdAt:  Date
  updatedAt:  Date
}

// Aggregated stats per worker — computed from reviews table
export interface WorkerRatingStats {
  workerId:     string
  avgRating:    number
  totalReviews: number
  breakdown:    {
    star1: number
    star2: number
    star3: number
    star4: number
    star5: number
  }
}
