import { IReviewRepository } from '../../domain/interfaces/IReviewRepository'
import { IBookingClient }    from '../../domain/interfaces/IServiceClients'
import { IWorkerClient }     from '../../domain/interfaces/IServiceClients'
import { SubmitReviewDto, ReviewResponseDto } from '../dtos/ReviewDto'

export class SubmitReview {
  constructor(
    private readonly reviewRepo:    IReviewRepository,
    private readonly bookingClient: IBookingClient,
    private readonly workerClient:  IWorkerClient,
  ) {}

  async execute(userId: string, dto: SubmitReviewDto): Promise<ReviewResponseDto> {
    // 1. Verify booking is completed and user was part of it
    const booking = await this.bookingClient.verifyBooking(dto.bookingId, userId)

    if (!booking.isEligible) {
      const err = new Error(
        'Cannot review — booking must be completed and you must be the user who booked',
      )
      ;(err as any).status = 403
      throw err
    }

    // 2. Check for duplicate review — one per booking enforced by DB unique constraint
    const existing = await this.reviewRepo.findByBookingId(dto.bookingId)
    if (existing) {
      const err = new Error('You have already reviewed this booking')
      ;(err as any).status = 409
      throw err
    }

    // 3. Validate rating range
    if (dto.rating < 1 || dto.rating > 5) {
      const err = new Error('Rating must be between 1 and 5')
      ;(err as any).status = 400
      throw err
    }

    // 4. Save review
    const review = await this.reviewRepo.create({
      bookingId: dto.bookingId,
      workerId:  booking.workerId,
      userId,
      rating:    dto.rating,
      comment:   dto.comment,
    })

    // 5. Recalculate worker's avg rating and push update to Worker Service
    // Action-based: POST /internal/workers { eventType: "rating_updated" }
    // Kafka migration: producer.publish('review.submitted', payload)
    const stats = await this.reviewRepo.getWorkerStats(booking.workerId)
    await this.workerClient.updateRating(
      booking.workerId,
      stats.avgRating,
      stats.totalReviews,
    )

    return this.toDto(review)
  }

  private toDto(review: any): ReviewResponseDto {
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
