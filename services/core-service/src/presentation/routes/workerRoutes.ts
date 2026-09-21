import { Router } from 'express'
import { WorkerController } from '../controllers/WorkerController'
import { extractUser }      from '../middlewares/extractUser'
import { validateRequest }  from '../middlewares/validateRequest'
import {
  searchWorkersSchema,
  updateWorkerProfileSchema,
  setCategoriesSchema,
  addPortfolioSchema,
  uploadDocumentSchema,
  idParamsSchema,
} from '@application/schemas/WorkerSchemas'

const router = Router()

// ── Public routes (no auth) ───────────────────────────────

// GET /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
router.get('/search',     validateRequest({ query: searchWorkersSchema }), WorkerController.search)

// GET /workers/categories
router.get('/categories', WorkerController.getCategories)

// GET /workers/:id  — must be AFTER /search and /categories
router.get('/:id', validateRequest({ params: idParamsSchema }), WorkerController.getById)

// ── Protected routes (JWT required via extractUser) ───────

// GET /workers/me
router.get('/me', extractUser, WorkerController.getMe)

// PATCH /workers/me
router.patch('/me', extractUser, validateRequest({ body: updateWorkerProfileSchema }), WorkerController.updateMe)

// PUT /workers/me/categories
router.put('/me/categories', extractUser, validateRequest({ body: setCategoriesSchema }), WorkerController.setCategories)

// ── Portfolio ──────────────────────────────────────────────

// GET  /workers/me/portfolio
router.get('/me/portfolio', extractUser, WorkerController.getPortfolioItems)

// POST /workers/me/portfolio
router.post('/me/portfolio', extractUser, validateRequest({ body: addPortfolioSchema }), WorkerController.addPortfolio)

// DELETE /workers/me/portfolio/:id
router.delete('/me/portfolio/:id', extractUser, validateRequest({ params: idParamsSchema }), WorkerController.removePortfolio)

// ── Documents ──────────────────────────────────────────────

// GET  /workers/me/documents
router.get('/me/documents', extractUser, WorkerController.getDocuments)

// POST /workers/me/documents
router.post('/me/documents', extractUser, validateRequest({ body: uploadDocumentSchema }), WorkerController.uploadDocument)

// DELETE /workers/me/documents/:id
router.delete('/me/documents/:id', extractUser, validateRequest({ params: idParamsSchema }), WorkerController.removeDocument)

export default router
