import { Request, Response, NextFunction } from 'express'
import { SubmitReview }         from '../../application/use-cases/SubmitReview'
import {
  GetWorkerReviews,
  GetWorkerRatingStats,
  GetMyReviews,
  GetBookingReview,
} from '../../application/use-cases/ReviewUseCases'
import { PrismaReviewRepository } from '../../infrastructure/repositories/PrismaReviewRepository'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { BookingClient, WorkerClient } from '../../infrastructure/services/ServiceClients'

// ── Compose dependencies ──────────────────────────────────
const reviewRepo    = new PrismaReviewRepository()
const bookingClient = new BookingClient()
const workerClient  = new WorkerClient()

const submitReview       = new SubmitReview(reviewRepo, bookingClient, workerClient)
const getWorkerReviews   = new GetWorkerReviews(reviewRepo)
const getWorkerStats     = new GetWorkerRatingStats(reviewRepo)
const getMyReviews       = new GetMyReviews(reviewRepo)
const getBookingReview   = new GetBookingReview(reviewRepo)

export class ReviewController {
  // POST /reviews
  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await submitReview.execute(userId, req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /reviews/my
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const { page, limit } = req.query as any
      const result = await getMyReviews.execute(userId, { page, limit })
      res.status(HttpStatus.OK).json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  }

  // GET /reviews/booking/:bookingId
  static async getByBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getBookingReview.execute(req.params.bookingId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /reviews/worker/:workerId
  static async getWorkerReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as any
      const result = await getWorkerReviews.execute(req.params.workerId, { page, limit })
      res.status(HttpStatus.OK).json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  }

  // GET /reviews/worker/:workerId/stats
  static async getWorkerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getWorkerStats.execute(req.params.workerId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }
}
