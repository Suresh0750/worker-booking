import { Router } from 'express'
import { WorkerController }     from '../controllers/WorkerController'
import { verifyInternalSecret, validateRequest } from '../middlewares/index'
import { internalEventSchema }  from '../../application/schemas/WorkerSchemas'

const router = Router()

// POST /internal/workers
// Handles all internal events via eventType field:
//   eventType: "create_profile" → from Auth Service after WORKER registers
//   eventType: "rating_updated" → from Review Service after review submitted
//   eventType: "media_uploaded" → from Media Service after S3 upload
// Kafka migration: each eventType becomes its own topic consumer
router.post(
  '/workers',
  verifyInternalSecret,
  validateRequest({ body: internalEventSchema }),
  WorkerController.handleInternalEvent
)

export default router
