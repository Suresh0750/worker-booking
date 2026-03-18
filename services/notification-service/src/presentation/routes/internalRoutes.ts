import { Router }                  from 'express'
import { NotificationController } from '../controllers/NotificationController'
import { verifyInternalSecret }   from '../middlewares/index'

const router = Router()

// POST /internal/notify
// All services call this to trigger notifications:
//
// Booking Service → booking_created, booking_status_changed, booking_cancelled
// Review Service  → review_submitted
// Any service     → new_message
//
// Kafka migration: this endpoint goes away — each eventType becomes a consumer topic
router.post('/notify', verifyInternalSecret, NotificationController.notify)

export default router
