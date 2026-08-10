import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { asyncHandler } from '../middlewares/asyncHandler'
import { validateRequest } from '../middlewares/validateRequest'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  verifyTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../../application/schemas/AuthSchemas'

const router = Router()

// POST /auth/register
router.post(
  '/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(AuthController.register)
)

// POST /auth/login
router.post(
  '/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(AuthController.login)
)

// POST /auth/send-otp
router.post(
  '/send-otp',
  validateRequest({ body: sendOtpSchema }),
  asyncHandler(AuthController.sendOtp)
)

// POST /auth/verify-otp
router.post(
  '/verify-otp',
  validateRequest({ body: verifyOtpSchema }),
  asyncHandler(AuthController.verifyOtp)
)

// POST /auth/refresh
router.post(
  '/refresh',
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(AuthController.refresh)
)

// POST /auth/logout
router.post(
  '/logout',
  validateRequest({ body: logoutSchema }),
  asyncHandler(AuthController.logout)
)

// POST /auth/logout-all
router.post('/logout-all', asyncHandler(AuthController.logoutAll))

export default router
