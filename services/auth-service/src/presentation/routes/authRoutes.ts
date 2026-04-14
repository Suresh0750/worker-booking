import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
import { asyncHandler } from '../middlewares/asyncHandler'
import {
  registerValidation,
  loginValidation,
  refreshValidation,
  validateRequest,
} from '../middlewares/validateRequest'

const router = Router()

// POST /auth/register
router.post(
  '/register',
  registerValidation,
  validateRequest,
  asyncHandler(AuthController.register)
)

// POST /auth/login
router.post(
  '/login',
  loginValidation,
  validateRequest,
  asyncHandler(AuthController.login)
)

// POST /auth/refresh
router.post(
  '/refresh',
  refreshValidation,
  validateRequest,
  asyncHandler(AuthController.refresh)
)

// POST /auth/logout
router.post('/logout', asyncHandler(AuthController.logout))

// POST /auth/logout-all
router.post('/logout-all', asyncHandler(AuthController.logoutAll))

export default router
