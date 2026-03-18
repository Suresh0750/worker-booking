import { Router } from 'express'
import { ReviewController } from '../controllers/ReviewController'
import {
  extractUser,
  validateRequest,
  submitReviewValidation,
  paginationValidation,
} from '../middlewares/index'

const router = Router()

// POST   /reviews                         → submit a review (auth required)
router.post(
  '/',
  extractUser,
  submitReviewValidation,
  validateRequest,
  ReviewController.submit,
)

// GET    /reviews/my                      → my submitted reviews (auth required)
router.get(
  '/my',
  extractUser,
  paginationValidation,
  validateRequest,
  ReviewController.getMy,
)

// GET    /reviews/booking/:bookingId      → review for a specific booking (public)
router.get('/booking/:bookingId', ReviewController.getByBooking)

// GET    /reviews/worker/:workerId        → all reviews for a worker (public)
router.get(
  '/worker/:workerId',
  paginationValidation,
  validateRequest,
  ReviewController.getWorkerReviews,
)

// GET    /reviews/worker/:workerId/stats  → rating stats + breakdown (public)
router.get('/worker/:workerId/stats', ReviewController.getWorkerStats)

export default router
