import { Router } from 'express'
import { WorkerController } from '../controllers/WorkerController'
import { extractUser, validateRequest } from '../middlewares/index'
import {
  updateProfileSchema,
  searchWorkersSchema,
  addAddressSchema,
  addPortfolioSchema,
  setCategoriesSchema,
  idParamsSchema,
} from '../../application/schemas/WorkerSchemas'

const router = Router()

// ── Public routes — no auth needed ───────────────────────
// GET  /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
router.get(
  '/search',
  validateRequest({ query: searchWorkersSchema }),
  WorkerController.search
)

// GET  /workers/categories
router.get('/categories', WorkerController.getCategories)

// GET  /workers/:id  — view any worker public profile
router.get('/:id', validateRequest({ params: idParamsSchema }), WorkerController.getById)

// ── Protected routes — worker must be logged in ───────────
// GET    /workers/me
router.get('/me', extractUser, WorkerController.getMe)

// PATCH  /workers/me
router.patch(
  '/me',
  extractUser,
  validateRequest({ body: updateProfileSchema }),
  WorkerController.updateMe
)

// PUT    /workers/me/categories
router.put(
  '/me/categories',
  extractUser,
  validateRequest({ body: setCategoriesSchema }),
  WorkerController.setCategories
)

// POST   /workers/me/addresses
router.post(
  '/me/addresses',
  extractUser,
  validateRequest({ body: addAddressSchema }),
  WorkerController.addAddress
)

// GET    /workers/me/portfolio
router.get('/me/portfolio', extractUser, WorkerController.getPortfolio)

// POST   /workers/me/portfolio
router.post(
  '/me/portfolio',
  extractUser,
  validateRequest({ body: addPortfolioSchema }),
  WorkerController.addPortfolioItem
)

// DELETE /workers/me/portfolio/:id
router.delete(
  '/me/portfolio/:id',
  extractUser,
  validateRequest({ params: idParamsSchema }),
  WorkerController.deletePortfolioItem
)

export default router
