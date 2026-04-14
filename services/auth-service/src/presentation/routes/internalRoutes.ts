import { Router } from 'express'
import { AuthController }        from '../controllers/AuthController'
import { asyncHandler }          from '../middlewares/asyncHandler'
import { verifyInternalSecret }  from '../middlewares/verifyInternalSecret'

const router = Router()

// All /internal routes are protected — only services with INTERNAL_SECRET can call these

// POST /internal/auth/verify — API Gateway calls this to validate every incoming JWT
router.post('/auth/verify', verifyInternalSecret, asyncHandler(AuthController.verifyToken))

export default router
