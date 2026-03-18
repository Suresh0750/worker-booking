import { Router } from 'express'
import { AuthController } from '../controllers/AuthController'
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
  AuthController.register
)

// POST /auth/login
router.post(
  '/login',
  loginValidation,
  validateRequest,
  AuthController.login
)

// POST /auth/refresh
router.post(
  '/refresh',
  refreshValidation,
  validateRequest,
  AuthController.refresh
)

// POST /auth/logout
router.post('/logout', AuthController.logout)

// POST /auth/logout-all
router.post('/logout-all', AuthController.logoutAll)

export default router
