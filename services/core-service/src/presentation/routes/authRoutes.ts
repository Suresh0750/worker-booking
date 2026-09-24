import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validateRequest } from '../middlewares/validateRequest'
import { authenticateJwt } from '../middlewares/authenticateJwt'
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '@application/schemas/AuthSchemas'

const router = Router()

// POST /auth/send-otp
router.post('/send-otp',         validateRequest({ body: sendOtpSchema }),   AuthController.sendOtp)

// POST /auth/verify-otp
router.post('/verify-otp',       validateRequest({ body: verifyOtpSchema }), AuthController.verifyOtp)

// POST /auth/send-login-otp   — OTP for already-registered users (post-login verification)
router.post('/send-login-otp',   validateRequest({ body: sendOtpSchema }),   AuthController.sendLoginOtp)

// POST /auth/verify-login-otp — verify the LOGIN-purpose OTP
router.post('/verify-login-otp', validateRequest({ body: verifyOtpSchema }), AuthController.verifyLoginOtp)

// POST /auth/register
router.post('/register',   validateRequest({ body: registerSchema }),   AuthController.register)

// POST /auth/login
router.post('/login',      validateRequest({ body: loginSchema }),      AuthController.login)

// POST /auth/refresh — refresh token is read from the httpOnly cookie
router.post('/refresh',    AuthController.refresh)

// POST /auth/logout — refresh token is read from the httpOnly cookie
router.post('/logout',     AuthController.logout)

// POST /auth/logout-all  — requires a valid JWT
router.post('/logout-all', authenticateJwt, AuthController.logoutAll)

export default router
