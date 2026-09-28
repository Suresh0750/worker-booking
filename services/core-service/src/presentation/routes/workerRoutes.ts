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
  updateWorkerAddress,
  changePass,
  createProjectSchema,
  updateProjectSchema,
} from '@application/schemas/WorkerSchemas'
import { avatarUpload, documentUpload, portfolioUpload } from '@infrastructure/config/upload'

const router = Router()

// ── Public routes ──────────────────────────────────────────

router.get('/search',     validateRequest({ query: searchWorkersSchema }), WorkerController.search)
router.get('/categories', WorkerController.getCategories)

// ── Protected routes (literal paths BEFORE /:id) ──────────

// Profile
router.get('/me',    authenticateJwt, WorkerController.getMe)
router.patch('/me',  authenticateJwt, validateRequest({ body: updateWorkerProfileSchema }), WorkerController.updateMe)

// Categories
router.put('/me/categories', authenticateJwt, validateRequest({ body: setCategoriesSchema }), WorkerController.setCategories)

// ── Portfolio Projects ─────────────────────────────────────

// GET  /workers/me/portfolio           — list all projects (with media)
router.get('/me/portfolio',
  authenticateJwt,
  WorkerController.getPortfolioProjects,
)

// POST /workers/me/portfolio/projects  — create a new project
router.post('/me/portfolio/projects',
  authenticateJwt,
  validateRequest({ body: createProjectSchema }),
  WorkerController.createProject,
)

// PATCH /workers/me/portfolio/projects/:id  — update project name/description/category
router.patch('/me/portfolio/projects/:id',
  authenticateJwt,
  validateRequest({ params: idParamsSchema, body: updateProjectSchema }),
  WorkerController.updateProject,
)

// DELETE /workers/me/portfolio/projects/:id  — delete project + all its media
router.delete('/me/portfolio/projects/:id',
  authenticateJwt,
  validateRequest({ params: idParamsSchema }),
  WorkerController.deleteProject,
)

// POST /workers/me/portfolio/projects/:id/media  — upload a file into a project
router.post('/me/portfolio/projects/:id/media',
  authenticateJwt,
  validateRequest({ params: idParamsSchema }),
  portfolioUpload.single('media'),
  WorkerController.addProjectMedia,
)

// DELETE /workers/me/portfolio/media/:mediaId  — delete a single media item
router.delete('/me/portfolio/media/:mediaId',
  authenticateJwt,
  WorkerController.deleteProjectMedia,
)

// ── Documents ──────────────────────────────────────────────

router.get('/documents',     authenticateJwt, WorkerController.getDocuments)
router.post('/documents',    authenticateJwt, documentUpload.single('document'), validateRequest({ body: uploadDocumentSchema }), WorkerController.uploadDocument)
router.delete('/documents/:id', authenticateJwt, validateRequest({ params: idParamsSchema }), WorkerController.removeDocument)

// ── Addresses ──────────────────────────────────────────────

router.post('/addresses',       authenticateJwt, validateRequest({ body: createWorkerAddress }), WorkerController.createAddress)
router.get('/addresses',        authenticateJwt, WorkerController.getAddress)
router.put('/addresses/:id',    authenticateJwt, validateRequest({ body: updateWorkerAddress }), WorkerController.updateAddress)

// ── Account ────────────────────────────────────────────────

router.put('/password', authenticateJwt, validateRequest({ body: changePass }), WorkerController.changePassWord)

// ── Public worker by id — MUST be last ────────────────────

router.get('/:id', validateRequest({ params: idParamsSchema }), WorkerController.getById)

export default router
