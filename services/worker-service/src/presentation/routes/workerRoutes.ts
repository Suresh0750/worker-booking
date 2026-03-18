import { Router } from 'express'
import { WorkerController } from '../controllers/WorkerController'
import {
  extractUser,
  updateProfileValidation,
  searchValidation,
  addAddressValidation,
  addPortfolioValidation,
  setCategoriesValidation,
  validateRequest,
} from '../middlewares/index'

const router = Router()

// ── Public routes — no auth needed ───────────────────────
// GET  /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
router.get('/search', searchValidation, validateRequest, WorkerController.search)

// GET  /workers/categories
router.get('/categories', WorkerController.getCategories)

// GET  /workers/:id  — view any worker public profile
router.get('/:id', WorkerController.getById)

// ── Protected routes — worker must be logged in ───────────
// GET    /workers/me
router.get('/me', extractUser, WorkerController.getMe)

// PATCH  /workers/me
router.patch(
  '/me',
  extractUser,
  updateProfileValidation,
  validateRequest,
  WorkerController.updateMe
)

// PUT    /workers/me/categories
router.put(
  '/me/categories',
  extractUser,
  setCategoriesValidation,
  validateRequest,
  WorkerController.setCategories
)

// POST   /workers/me/addresses
router.post(
  '/me/addresses',
  extractUser,
  addAddressValidation,
  validateRequest,
  WorkerController.addAddress
)

// GET    /workers/me/portfolio
router.get('/me/portfolio', extractUser, WorkerController.getPortfolio)

// POST   /workers/me/portfolio
router.post(
  '/me/portfolio',
  extractUser,
  addPortfolioValidation,
  validateRequest,
  WorkerController.addPortfolioItem
)

// DELETE /workers/me/portfolio/:id
router.delete('/me/portfolio/:id', extractUser, WorkerController.deletePortfolioItem)

export default router
