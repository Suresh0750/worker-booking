import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { validateRequest } from '../middlewares/validateRequest'
import { extractUser } from '../middlewares/extractUser'
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
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

// POST /auth/refresh
router.post('/refresh',    validateRequest({ body: refreshTokenSchema }), AuthController.refresh)

// POST /auth/logout
router.post('/logout',     validateRequest({ body: logoutSchema }),     AuthController.logout)

// POST /auth/logout-all  — requires a valid user identity from API Gateway
router.post('/logout-all', extractUser, AuthController.logoutAll)

export default router
