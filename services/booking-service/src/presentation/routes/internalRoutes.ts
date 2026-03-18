import { Router } from 'express'
import { verifyInternalSecret } from '../middlewares/index'
import { PrismaBookingRepository } from '../../infrastructure/repositories/PrismaBookingRepository'

const router      = Router()
const bookingRepo = new PrismaBookingRepository()

// POST /internal/bookings
// Currently only used by Review Service to verify a booking is COMPLETED
// before allowing a review to be submitted
router.post('/bookings/verify', verifyInternalSecret, async (req, res, next) => {
  try {
    const { bookingId, userId } = req.body

    if (!bookingId || !userId) {
      res.status(400).json({ success: false, message: 'bookingId and userId are required' })
      return
    }

    const booking = await bookingRepo.findById(bookingId)

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' })
      return
    }

    // Review Service needs to know:
    // 1. Booking is completed
    // 2. This userId was part of the booking
    const isEligible =
      booking.status === 'COMPLETED' && booking.userId === userId

    res.status(200).json({
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
})

export default router
