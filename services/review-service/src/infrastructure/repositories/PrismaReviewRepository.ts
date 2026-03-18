import { prisma } from '../config/prisma'
import {
  IReviewRepository,
  CreateReviewInput,
  FindReviewsInput,
} from '../../domain/interfaces/IReviewRepository'
import { ReviewEntity, WorkerRatingStats } from '../../domain/entities/Review'

export class PrismaReviewRepository implements IReviewRepository {
  async findById(id: string): Promise<ReviewEntity | null> {
    return prisma.review.findUnique({ where: { id } }) as Promise<ReviewEntity | null>
  }

  async findByBookingId(bookingId: string): Promise<ReviewEntity | null> {
    return prisma.review.findUnique({
      where: { bookingId },
    }) as Promise<ReviewEntity | null>
  }

  async findMany(
    input: FindReviewsInput,
  ): Promise<{ data: ReviewEntity[]; total: number }> {
    const { workerId, userId, page = 1, limit = 10 } = input
    const skip = (page - 1) * limit

    const where = {
      isVisible: true,
      ...(workerId ? { workerId } : {}),
      ...(userId   ? { userId }   : {}),
    }

    const [data, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ])

    return { data: data as ReviewEntity[], total }
  }

  async create(data: CreateReviewInput): Promise<ReviewEntity> {
    return prisma.review.create({
      data: {
        bookingId:  data.bookingId,
        workerId:   data.workerId,
        userId:     data.userId,
        userName:   data.userName,
        workerName: data.workerName,
        rating:     data.rating,
        comment:    data.comment,
      },
    }) as Promise<ReviewEntity>
  }

  async getWorkerStats(workerId: string): Promise<WorkerRatingStats> {
    // Single query — get count and avg together
    const result = await prisma.review.aggregate({
      where:   { workerId, isVisible: true },
      _avg:    { rating: true },
      _count:  { rating: true },
    })

    // Breakdown per star rating
    const breakdown = await prisma.review.groupBy({
      by:    ['rating'],
      where: { workerId, isVisible: true },
      _count: { rating: true },
    })

    const starMap = { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 }
    breakdown.forEach((b) => {
      const key = `star${b.rating}` as keyof typeof starMap
      starMap[key] = b._count.rating
    })

    return {
      workerId,
      avgRating:    Math.round((result._avg.rating ?? 0) * 10) / 10,
      totalReviews: result._count.rating,
      breakdown:    starMap,
    }
  }

  async hide(id: string): Promise<void> {
    await prisma.review.update({ where: { id }, data: { isVisible: false } })
  }
}
