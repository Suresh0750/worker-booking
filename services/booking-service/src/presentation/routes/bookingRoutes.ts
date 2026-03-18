import { Router } from 'express'
import { BookingController } from '../controllers/BookingController'
import {
  extractUser,
  validateRequest,
  createBookingValidation,
  updateStatusValidation,
  updatePriceValidation,
  sendMessageValidation,
  getBookingsValidation,
} from '../middlewares/index'

const router = Router()

// All booking routes require authentication
// API Gateway injects x-user-id and x-user-role headers after JWT validation

// POST   /bookings              → user creates a hire request
router.post(
  '/',
  extractUser,
  createBookingValidation,
  validateRequest,
  BookingController.create,
)

// GET    /bookings/my           → list own bookings (user or worker)
router.get(
  '/my',
  extractUser,
  getBookingsValidation,
  validateRequest,
  BookingController.getMy,
)

// GET    /bookings/:id          → get single booking + messages
router.get('/:id', extractUser, BookingController.getOne)

// PATCH  /bookings/:id/status   → update booking status (state machine)
router.patch(
  '/:id/status',
  extractUser,
  updateStatusValidation,
  validateRequest,
  BookingController.updateStatus,
)

// PATCH  /bookings/:id/price    → agree on price
router.patch(
  '/:id/price',
  extractUser,
  updatePriceValidation,
  validateRequest,
  BookingController.updatePrice,
)

// GET    /bookings/:id/messages → get all messages for a booking
router.get('/:id/messages', extractUser, BookingController.getMessages)

// POST   /bookings/:id/messages → send a message
router.post(
  '/:id/messages',
  extractUser,
  sendMessageValidation,
  validateRequest,
  BookingController.sendMessage,
)

// GET    /bookings/:id/logs     → full status change audit trail
router.get('/:id/logs', extractUser, BookingController.getStatusLogs)

export default router
