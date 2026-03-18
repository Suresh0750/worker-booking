import { ReviewEntity, WorkerRatingStats } from '../entities/Review'

export interface CreateReviewInput {
  bookingId:  string
  workerId:   string
  userId:     string
  userName?:  string
  workerName?: string
  rating:     number
  comment?:   string
}

export interface FindReviewsInput {
  workerId?: string
  userId?:   string
  page?:     number
  limit?:    number
}

export interface IReviewRepository {
  findById(id: string): Promise<ReviewEntity | null>
  findByBookingId(bookingId: string): Promise<ReviewEntity | null>
  findMany(input: FindReviewsInput): Promise<{ data: ReviewEntity[]; total: number }>
  create(data: CreateReviewInput): Promise<ReviewEntity>
  getWorkerStats(workerId: string): Promise<WorkerRatingStats>
  hide(id: string): Promise<void>
}
