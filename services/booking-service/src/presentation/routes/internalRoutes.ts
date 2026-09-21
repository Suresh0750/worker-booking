import { Router } from 'express'
import { verifyInternalSecret, validateRequest } from '../middlewares/index'
import { HttpStatus } from '../../domain/enums/HttpStatus'
import { PrismaBookingRepository } from '../../infrastructure/repositories/PrismaBookingRepository'
import { verifyBookingSchema } from '../../application/schemas/BookingSchemas'

const router      = Router()
const bookingRepo = new PrismaBookingRepository()

// POST /internal/bookings
// Currently only used by Review Service to verify a booking is COMPLETED
// before allowing a review to be submitted
router.post(
  '/bookings/verify',
  verifyInternalSecret,
  validateRequest({ body: verifyBookingSchema }),
  async (req, res, next) => {
    try {
      const { bookingId, userId } = req.body

      const booking = await bookingRepo.findById(bookingId)

      if (!booking) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Booking not found' })
        return
      }

      // Review Service needs to know:
      // 1. Booking is completed
      // 2. This userId was part of the booking
      const isEligible =
        booking.status === 'COMPLETED' && booking.userId === userId

      res.status(HttpStatus.OK).json({
        success: true,
        data: {
          isEligible,
          workerId:  booking.workerId,
          userId:    booking.userId,
          status:    booking.status,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
