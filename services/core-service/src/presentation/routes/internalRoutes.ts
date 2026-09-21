import { Router } from 'express'
import { AuthController }   from '../controllers/AuthController'
import { WorkerController } from '../controllers/WorkerController'
import { verifyInternalSecret }  from '../middlewares/verifyInternalSecret'
import { validateRequest }       from '../middlewares/validateRequest'
import { verifyTokenSchema }     from '@application/schemas/AuthSchemas'
import {
  internalWorkerEventSchema,
  reviewDocumentSchema,
  idParamsSchema,
} from '@application/schemas/WorkerSchemas'

const router = Router()

// All /internal routes require the shared x-internal-secret header

// ── Auth ──────────────────────────────────────────────────
// POST /internal/auth/verify — API Gateway calls this to validate any JWT
router.post(
  '/auth/verify',
  verifyInternalSecret,
  validateRequest({ body: verifyTokenSchema }),
  AuthController.verifyToken,
)

// ── Workers ───────────────────────────────────────────────
// POST /internal/workers — action-based endpoint (create_profile | rating_updated | media_uploaded)
router.post(
  '/workers',
  verifyInternalSecret,
  validateRequest({ body: internalWorkerEventSchema }),
  WorkerController.handleInternalEvent,
)

// PATCH /internal/workers/documents/:id/review — admin reviews a worker document
router.patch(
  '/workers/documents/:id/review',
  verifyInternalSecret,
  validateRequest({ params: idParamsSchema, body: reviewDocumentSchema }),
  WorkerController.reviewDocument,
)

export default router
