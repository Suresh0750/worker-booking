import { Router } from 'express'
import { ReviewController } from '../controllers/ReviewController'
import { extractUser, validateRequest } from '../middlewares/index'
import {
  submitReviewSchema,
  paginationSchema,
  bookingIdParamsSchema,
  workerIdParamsSchema,
} from '../../application/schemas/ReviewSchemas'

const router = Router()

// POST   /reviews                         → submit a review (auth required)
router.post(
  '/',
  extractUser,
  validateRequest({ body: submitReviewSchema }),
  ReviewController.submit,
)

// GET    /reviews/my                      → my submitted reviews (auth required)
router.get(
  '/my',
  extractUser,
  validateRequest({ query: paginationSchema }),
  ReviewController.getMy,
)

// GET    /reviews/booking/:bookingId      → review for a specific booking (public)
router.get(
  '/booking/:bookingId',
  validateRequest({ params: bookingIdParamsSchema }),
  ReviewController.getByBooking,
)

// GET    /reviews/worker/:workerId        → all reviews for a worker (public)
router.get(
  '/worker/:workerId',
  validateRequest({ params: workerIdParamsSchema, query: paginationSchema }),
  ReviewController.getWorkerReviews,
)

// GET    /reviews/worker/:workerId/stats  → rating stats + breakdown (public)
router.get(
  '/worker/:workerId/stats',
  validateRequest({ params: workerIdParamsSchema }),
  ReviewController.getWorkerStats,
)

export default router
