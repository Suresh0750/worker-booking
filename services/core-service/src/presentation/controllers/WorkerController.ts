import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { NotFoundError, BadRequestError } from '@domain/errors/AppError'
import {
  createWorkerProfile,
  getWorkerProfile,
  updateWorkerProfile,
  setWorkerCategories,
  searchWorkers,
  updateWorkerRating,
  // legacy portfolio (kept for internal event handler)
  addPortfolioItem,
  deletePortfolioItem,
  getPortfolio,
  // new project-based portfolio
  getPortfolioProjects,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  addMediaToProject,
  deleteMediaFromProject,
  uploadWorkerDocument,
  getWorkerDocuments,
  reviewWorkerDocument,
  deleteWorkerDocument,
  categoryRepo,
  workerRepo,
  workersAddress,
  registerUser,
} from '@infrastructure/config/dependencies'
import { childLogger } from '@infrastructure/config/logger'
import { getImageUrl, uploadImage, deleteImageSilent } from '@infrastructure/services/storage.service'

export class WorkerController {

  // ── Public routes ─────────────────────────────────────────

  // GET /workers/search
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    log.info('Worker search requested', { query: req.query })
    try {
      const result = await searchWorkers.execute(req.query as any)
      log.info('Worker search completed', { count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result, count: result.length })
    } catch (err) { next(err) }
  }

  // GET /workers/categories
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    try {
      const result = await categoryRepo.findAll()
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/:id
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    try {
      const result = await getWorkerProfile.executeById(req.params.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // ── Protected routes ──────────────────────────────────────

  // GET /workers/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      const result = await getWorkerProfile.executeByUserId(userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /workers/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const result = await updateWorkerProfile.execute(userId, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PUT /workers/me/categories
  static async setCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')
      await setWorkerCategories.execute(worker.id, req.body)
      res.status(HttpStatus.OK).json({ success: true, message: 'Categories updated' })
    } catch (err) { next(err) }
  }

  // ── Portfolio Projects ────────────────────────────────────

  // GET /workers/me/portfolio
  static async getPortfolioProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const projects = await getPortfolioProjects.execute(worker.id)

      // Sign all media URLs
      const signed = await Promise.all(
        projects.map(async (proj) => ({
          ...proj,
          media: await Promise.all(
            proj.media.map(async (m) => ({
              ...m,
              mediaUrl: await getImageUrl(m.mediaUrl).catch(() => m.mediaUrl),
            })),
          ),
        })),
      )

      log.info('Portfolio projects fetched', { userId, count: signed.length })
      res.status(HttpStatus.OK).json({ success: true, data: signed })
    } catch (err) { next(err) }
  }

  // POST /workers/me/portfolio/projects
  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const project = await createPortfolioProject.execute(worker.id, req.body)
      log.info('Portfolio project created', { userId, projectId: project.id })
      res.status(HttpStatus.CREATED).json({ success: true, data: project })
    } catch (err) { next(err) }
  }

  // PATCH /workers/me/portfolio/projects/:id
  static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const project = await updatePortfolioProject.execute(req.params.id, worker.id, req.body)
      log.info('Portfolio project updated', { userId, projectId: project.id })
      res.status(HttpStatus.OK).json({ success: true, data: project })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/portfolio/projects/:id
  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      await deletePortfolioProject.execute(req.params.id, userId)
      log.info('Portfolio project deleted', { userId, projectId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Project deleted' })
    } catch (err) { next(err) }
  }

  // POST /workers/me/portfolio/projects/:id/media
  static async addProjectMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId as string
    try {
      const file = (req as any).file as Express.Multer.File | undefined
      if (!file) throw new BadRequestError('No media file uploaded')

      // Determine mediaType from mime
      const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE'

      const ext = path.extname(file.originalname).toLowerCase()
      const key = `workers/${userId}/portfolio/${req.params.id}/${Date.now()}${ext}`
      await uploadImage(file, key)

      const media = await addMediaToProject.execute(req.params.id, userId, {
        mediaUrl:  key,
        mediaType,
        caption:   req.body.caption,
      })

      const signedUrl = await getImageUrl(key).catch(() => key)
      log.info('Portfolio media added', { userId, projectId: req.params.id, mediaId: media.id })
      res.status(HttpStatus.CREATED).json({
        success: true,
        data: { ...media, mediaUrl: signedUrl },
      })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/portfolio/media/:mediaId
  static async deleteProjectMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    try {
      await deleteMediaFromProject.execute(req.params.mediaId, userId)
      log.info('Portfolio media deleted', { userId, mediaId: req.params.mediaId })
      res.status(HttpStatus.OK).json({ success: true, message: 'Media deleted' })
    } catch (err) { next(err) }
  }

  // ── Legacy portfolio item handlers (kept for internal event handler) ────────

  static async getPortfolioItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')
      const result = await getPortfolio.execute(worker.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async addPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')
      const result = await addPortfolioItem.execute(worker.id, req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async removePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      await deletePortfolioItem.execute(req.params.id, userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Portfolio item deleted' })
    } catch (err) { next(err) }
  }

  // ── Documents ──────────────────────────────────────────────

  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId as string
    try {
      const file = (req as any).file as Express.Multer.File | undefined
      if (!file) throw new BadRequestError('No image file uploaded')

      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const ext = path.extname(file.originalname).toLowerCase()
      const key = `workers/${userId}/documents/${req.body.documentType.toLowerCase()}-${Date.now()}${ext}`
      await uploadImage(file, key)

      const result = await uploadWorkerDocument.execute(userId, { ...req.body, documentUrl: key })
      const documentUrl = await getImageUrl(result.documentUrl)
      res.status(HttpStatus.CREATED).json({ success: true, data: { ...result, documentUrl } })
    } catch (err) { next(err) }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const result = await getWorkerDocuments.execute(userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      await deleteWorkerDocument.execute(req.params.id, userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Document deleted' })
    } catch (err) { next(err) }
  }

  // ── Internal events ────────────────────────────────────────

  static async handleInternalEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const { eventType, data } = req.body
    try {
      const handlers: Record<string, () => Promise<any>> = {
        create_profile: () => createWorkerProfile.execute({ userId: data.userId, ...data }),
        rating_updated: () => updateWorkerRating.execute(data),
        media_uploaded: async () => {
          const w = await workerRepo.findById(data.workerId)
          if (!w) throw new NotFoundError('Worker not found')
          return addPortfolioItem.execute(w.id, {
            mediaUrl:  data.mediaUrl,
            mediaType: data.mediaType,
            caption:   data.caption,
          })
        },
      }
      const handler = handlers[eventType]
      if (!handler) throw new BadRequestError(`Unknown eventType: ${eventType}`)
      const result = await handler()
      res.status(HttpStatus.OK).json({ success: true, data: result ?? null })
    } catch (err) { next(err) }
  }

  // ── Admin — document review ────────────────────────────────

  static async reviewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reviewWorkerDocument.execute(req.params.id, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // ── Worker Address ─────────────────────────────────────────

  static async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const result = await workersAddress.execute({ ...req.body, userId })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      if (!userId) throw new BadRequestError('User id is missing')
      const result = await workersAddress.get(userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = (req as any).userId
    try {
      const result = await workersAddress.update({ ...req.body, id: req.params.id, userId })
      if (req.body.isPrimary === true) {
        const allAddresses = await workersAddress.get(userId)
        for (const address of allAddresses) {
          if (address.id !== req.params.id && address.isPrimary) {
            await workersAddress.update({ id: address.id, userId, isPrimary: false })
          }
        }
      }
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async changePassWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await registerUser.changePass({ userId, ...req.body })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}
