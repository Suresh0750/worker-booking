import { Request, Response, NextFunction } from 'express'
import { HttpStatus } from '@domain/enums/HttpStatus'
import {
  createWorkerProfile,
  getWorkerProfile,
  updateWorkerProfile,
  setWorkerCategories,
  searchWorkers,
  updateWorkerRating,
  addPortfolioItem,
  deletePortfolioItem,
  getPortfolio,
  uploadWorkerDocument,
  getWorkerDocuments,
  reviewWorkerDocument,
  deleteWorkerDocument,
  categoryRepo,
  workerRepo,
  workersAddress
} from '@infrastructure/config/dependencies'


export class WorkerController {

  // ── Public routes ─────────────────────────────────────────

  // GET /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await searchWorkers.execute(req.query as any)
      res.status(HttpStatus.OK).json({ success: true, data: result, count: result.length })
    } catch (err) { next(err) }
  }

  // GET /workers/categories
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await categoryRepo.findAll()
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/:id
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getWorkerProfile.executeById(req.params.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // ── Protected routes (extractUser middleware required) ────

  // GET /workers/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getWorkerProfile.executeByUserId((req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /workers/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await updateWorkerProfile.execute((req as any).userId, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PUT /workers/me/categories
  static async setCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const worker = await workerRepo.findByUserId((req as any).userId)
      if (!worker) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Worker not found' })
        return
      }
      await setWorkerCategories.execute(worker.id, req.body)
      res.status(HttpStatus.OK).json({ success: true, message: 'Categories updated' })
    } catch (err) { next(err) }
  }

  // ── Portfolio ──────────────────────────────────────────────

  // GET /workers/me/portfolio
  static async getPortfolioItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const worker = await workerRepo.findByUserId((req as any).userId)
      if (!worker) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Worker not found' })
        return
      }
      const result = await getPortfolio.execute(worker.id)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /workers/me/portfolio
  static async addPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const worker = await workerRepo.findByUserId((req as any).userId)
      if (!worker) {
        res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Worker not found' })
        return
      }
      const result = await addPortfolioItem.execute(worker.id, req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/portfolio/:id
  static async removePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deletePortfolioItem.execute(req.params.id, (req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Portfolio item deleted' })
    } catch (err) { next(err) }
  }

  // ── Documents ──────────────────────────────────────────────

  // POST /workers/me/documents
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await uploadWorkerDocument.execute((req as any).userId, req.body)
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/me/documents
  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getWorkerDocuments.execute((req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/documents/:id
  static async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deleteWorkerDocument.execute(req.params.id, (req as any).userId)
      res.status(HttpStatus.OK).json({ success: true, message: 'Document deleted' })
    } catch (err) { next(err) }
  }

  // ── Internal events ────────────────────────────────────────

  // POST /internal/workers
  static async handleInternalEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventType, data } = req.body

      const handlers: Record<string, () => Promise<any>> = {
        // Auth Service → create worker row after WORKER registers
        create_profile: () => createWorkerProfile.execute({ userId: data.userId, ...data }),

        // Review Service → update rating after review submitted
        rating_updated: () => updateWorkerRating.execute(data),

        // Media Service → attach portfolio item after S3 upload
        media_uploaded: async () => {
          const w = await workerRepo.findById(data.workerId)
          if (!w) throw Object.assign(new Error('Worker not found'), { status: 404 })
          return addPortfolioItem.execute(w.id, {
            mediaUrl:  data.mediaUrl,
            mediaType: data.mediaType,
            caption:   data.caption,
          })
        },
      }

      const handler = handlers[eventType]
      if (!handler) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: `Unknown eventType: ${eventType}` })
        return
      }

      const result = await handler()
      res.status(HttpStatus.OK).json({ success: true, data: result ?? null })
    } catch (err) { next(err) }
  }

  // ── Admin — document review ────────────────────────────────

  // PATCH /internal/workers/documents/:id/review
  static async reviewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await reviewWorkerDocument.execute(req.params.id, req.body)
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // - Worker Address
  
  static async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await workersAddress.execute({
        ...req.body,
        userId: (req as any).userId
      })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
  static async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await workersAddress.get({
        ...req.body,
        userId: (req as any).userId
      })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}
