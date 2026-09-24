import { Router } from 'express'
import { WorkerController } from '../controllers/WorkerController'
import { authenticateJwt }  from '../middlewares/authenticateJwt'
import { validateRequest }  from '../middlewares/validateRequest'
import {
  searchWorkersSchema,
  updateWorkerProfileSchema,
  setCategoriesSchema,
  addPortfolioSchema,
  uploadDocumentSchema,
  idParamsSchema,
  createWorkerAddress,
} from '@application/schemas/WorkerSchemas'

const router = Router()

// ── Public routes (no auth) ───────────────────────────────

// GET /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
router.get('/search',     validateRequest({ query: searchWorkersSchema }), WorkerController.search)

// GET /workers/categories
router.get('/categories', WorkerController.getCategories)

// ── Protected routes — declared BEFORE /:id so 'me' isn't matched as an id ──

// GET /workers/me
router.get('/me', authenticateJwt, WorkerController.getMe)

// PATCH /workers/me
router.patch('/me', authenticateJwt, validateRequest({ body: updateWorkerProfileSchema }), WorkerController.updateMe)

// PUT /workers/me/categories
router.put('/me/categories', authenticateJwt, validateRequest({ body: setCategoriesSchema }), WorkerController.setCategories)

// ── Portfolio ──────────────────────────────────────────────

// GET  /workers/me/portfolio
router.get('/me/portfolio', authenticateJwt, WorkerController.getPortfolioItems)

// POST /workers/me/portfolio
router.post('/me/portfolio', authenticateJwt, validateRequest({ body: addPortfolioSchema }), WorkerController.addPortfolio)

// DELETE /workers/me/portfolio/:id
router.delete('/me/portfolio/:id', authenticateJwt, validateRequest({ params: idParamsSchema }), WorkerController.removePortfolio)

// ── Documents ──────────────────────────────────────────────

// GET  /workers/me/documents
router.get('/me/documents', authenticateJwt, WorkerController.getDocuments)

// POST /workers/me/documents
router.post('/me/documents', authenticateJwt, validateRequest({ body: uploadDocumentSchema }), WorkerController.uploadDocument)

// DELETE /workers/me/documents/:id
router.delete('/me/documents/:id', authenticateJwt, validateRequest({ params: idParamsSchema }), WorkerController.removeDocument)

// GET /workers/:id  — MUST be last so literal paths above are matched first
router.get('/:id', validateRequest({ params: idParamsSchema }), WorkerController.getById)
router.post('/addresses',authenticateJwt, validateRequest({ body: createWorkerAddress }), WorkerController.createAddress)

export default router
