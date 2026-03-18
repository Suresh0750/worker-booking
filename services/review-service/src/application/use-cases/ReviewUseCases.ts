import { IReviewRepository } from '../../domain/interfaces/IReviewRepository'
import { GetReviewsDto, ReviewListDto, ReviewResponseDto, WorkerRatingDto } from '../dtos/ReviewDto'

// ── Get all reviews for a worker ──────────────────────────
export class GetWorkerReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  async execute(workerId: string, dto: GetReviewsDto): Promise<ReviewListDto> {
    const page  = dto.page  ?? 1
    const limit = dto.limit ?? 10

    const { data, total } = await this.reviewRepo.findMany({
      workerId,
      page,
      limit,
    })

    return {
      data: data.map((r) => ({
        id:         r.id,
        bookingId:  r.bookingId,
        workerId:   r.workerId,
        userId:     r.userId,
        userName:   r.userName,
        workerName: r.workerName,
        rating:     r.rating,
        comment:    r.comment,
        createdAt:  r.createdAt,
      })),
      total,
      page,
      limit,
    }
  }
}

// ── Get rating stats for a worker ─────────────────────────
export class GetWorkerRatingStats {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  async execute(workerId: string): Promise<WorkerRatingDto> {
    const stats = await this.reviewRepo.getWorkerStats(workerId)
    return {
      workerId:     stats.workerId,
      avgRating:    stats.avgRating,
      totalReviews: stats.totalReviews,
      breakdown:    stats.breakdown,
    }
  }
}

// ── Get reviews written by a user ─────────────────────────
export class GetMyReviews {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  async execute(userId: string, dto: GetReviewsDto): Promise<ReviewListDto> {
    const page  = dto.page  ?? 1
    const limit = dto.limit ?? 10

    const { data, total } = await this.reviewRepo.findMany({ userId, page, limit })

    return {
      data: data.map((r) => ({
        id:         r.id,
        bookingId:  r.bookingId,
        workerId:   r.workerId,
        userId:     r.userId,
        userName:   r.userName,
        workerName: r.workerName,
        rating:     r.rating,
        comment:    r.comment,
        createdAt:  r.createdAt,
      })),
      total,
      page,
      limit,
    }
  }
}

// ── Get review for a specific booking ─────────────────────
export class GetBookingReview {
  constructor(private readonly reviewRepo: IReviewRepository) {}

  async execute(bookingId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewRepo.findByBookingId(bookingId)
    if (!review) return null

    return {
      id:         review.id,
      bookingId:  review.bookingId,
      workerId:   review.workerId,
      userId:     review.userId,
      userName:   review.userName,
      workerName: review.workerName,
      rating:     review.rating,
      comment:    review.comment,
      createdAt:  review.createdAt,
    }
  }
}
