import { Router } from 'express'
import { BookingController } from '../controllers/BookingController'
import { extractUser, validateRequest } from '../middlewares/index'
import {
  createBookingSchema,
  updateStatusSchema,
  updatePriceSchema,
  sendMessageSchema,
  getBookingsSchema,
  idParamsSchema,
} from '../../application/schemas/BookingSchemas'

const router = Router()

// All booking routes require authentication
// API Gateway injects x-user-id and x-user-role headers after JWT validation

// POST   /bookings              → user creates a hire request
router.post(
  '/',
  extractUser,
  validateRequest({ body: createBookingSchema }),
  BookingController.create,
)

// GET    /bookings/my           → list own bookings (user or worker)
router.get(
  '/my',
  extractUser,
  validateRequest({ query: getBookingsSchema }),
  BookingController.getMy,
)

// GET    /bookings/:id          → get single booking + messages
router.get(
  '/:id',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  BookingController.getOne,
)

// PATCH  /bookings/:id/status   → update booking status (state machine)
router.patch(
  '/:id/status',
  extractUser,
  validateRequest({ params: idParamsSchema, body: updateStatusSchema }),
  BookingController.updateStatus,
)

// PATCH  /bookings/:id/price    → agree on price
router.patch(
  '/:id/price',
  extractUser,
  validateRequest({ params: idParamsSchema, body: updatePriceSchema }),
  BookingController.updatePrice,
)

// GET    /bookings/:id/messages → get all messages for a booking
router.get(
  '/:id/messages',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  BookingController.getMessages,
)

// POST   /bookings/:id/messages → send a message
router.post(
  '/:id/messages',
  extractUser,
  validateRequest({ params: idParamsSchema, body: sendMessageSchema }),
  BookingController.sendMessage,
)

// GET    /bookings/:id/logs     → full status change audit trail
router.get(
  '/:id/logs',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  BookingController.getStatusLogs,
)

export default router
