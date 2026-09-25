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
  addPortfolioItem,
  deletePortfolioItem,
  getPortfolio,
  uploadWorkerDocument,
  getWorkerDocuments,
  reviewWorkerDocument,
  deleteWorkerDocument,
  categoryRepo,
  workerRepo,
  workersAddress,
} from '@infrastructure/config/dependencies'
import { childLogger } from '@infrastructure/config/logger'
import { getImageUrl, uploadImage } from '@infrastructure/services/storage.service'


export class WorkerController {

  // ── Public routes ─────────────────────────────────────────

  // GET /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
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
    log.info('Get worker categories requested')
    try {
      const result = await categoryRepo.findAll()
      log.info('Worker categories fetched', { count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/:id
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    log.info('Get worker by id requested', { workerId: req.params.id })
    try {
      const result = await getWorkerProfile.executeById(req.params.id)
      log.info('Worker profile fetched by id', { workerId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // ── Protected routes ──────────────────────────────────────

  // GET /workers/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get own worker profile requested', { userId })
    try {
      const result = await getWorkerProfile.executeByUserId(userId)
      log.info('Own worker profile fetched', { userId })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /workers/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Update own worker profile requested', { userId })
    try {
      const result = await updateWorkerProfile.execute(userId, req.body)
      log.info('Worker profile updated', { userId })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PUT /workers/me/categories
  static async setCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Set worker categories requested', { userId })
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      await setWorkerCategories.execute(worker.id, req.body)
      log.info('Worker categories updated', { userId, workerId: worker.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Categories updated' })
    } catch (err) { next(err) }
  }

  // ── Portfolio ──────────────────────────────────────────────

  // GET /workers/me/portfolio
  static async getPortfolioItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get worker portfolio requested', { userId })
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const result = await getPortfolio.execute(worker.id)
      log.info('Worker portfolio fetched', { userId, count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /workers/me/portfolio
  static async addPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Add portfolio item requested', { userId })
    try {
      const worker = await workerRepo.findByUserId(userId)
      if (!worker) throw new NotFoundError('Worker not found')

      const result = await addPortfolioItem.execute(worker.id, req.body)
      log.info('Portfolio item added', { userId, workerId: worker.id, itemId: result.id })
      res.status(HttpStatus.CREATED).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/portfolio/:id
  static async removePortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Remove portfolio item requested', { userId, itemId: req.params.id })
    try {
      await deletePortfolioItem.execute(req.params.id, userId)
      log.info('Portfolio item deleted', { userId, itemId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Portfolio item deleted' })
    } catch (err) { next(err) }
  }

  // ── Documents ──────────────────────────────────────────────

  // POST /workers/me/documents
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId as string
    log.info('Upload worker document requested', { userId, documentType: req.body.documentType })
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
      log.info('Worker document uploaded', { userId, documentType: req.body.documentType, documentId: result.id })
      res.status(HttpStatus.CREATED).json({ success: true, data: { ...result, documentUrl } })
    } catch (err) { next(err) }
  }

  // GET /workers/me/documents
  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get worker documents requested', { userId })
    try {
      const result = await getWorkerDocuments.execute(userId)
      log.info('Worker documents fetched', { userId, count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/documents/:id
  static async removeDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Remove worker document requested', { userId, documentId: req.params.id })
    try {
      await deleteWorkerDocument.execute(req.params.id, userId)
      log.info('Worker document deleted', { userId, documentId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, message: 'Document deleted' })
    } catch (err) { next(err) }
  }

  // ── Internal events ────────────────────────────────────────

  // POST /internal/workers
  static async handleInternalEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const { eventType, data } = req.body
    log.info('Internal worker event received', { eventType })
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
      log.info('Internal worker event handled', { eventType })
      res.status(HttpStatus.OK).json({ success: true, data: result ?? null })
    } catch (err) { next(err) }
  }

  // ── Admin — document review ────────────────────────────────

  // PATCH /internal/workers/documents/:id/review
  static async reviewDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    log.info('Review worker document requested', { documentId: req.params.id })
    try {
      const result = await reviewWorkerDocument.execute(req.params.id, req.body)
      log.info('Worker document reviewed', { documentId: req.params.id, status: req.body.status })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // ── Worker Address ─────────────────────────────────────────

  static async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Create worker address requested', { userId })
    try {
      const result = await workersAddress.execute({ ...req.body, userId })
      log.info('Worker address created', { userId, addressId: result.id })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async getAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Get worker addresses requested', { userId })
    try {
      if (!userId) throw new BadRequestError('User id is missing')
      const result = await workersAddress.get(userId)
      log.info('Worker addresses fetched', { userId, count: result.length })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  static async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    const log = childLogger(req)
    const userId = (req as any).userId
    log.info('Update worker address requested', { userId, addressId: req.params.id })
    try {
      const result = await workersAddress.update({
        ...req.body,
        id:     req.params.id,
        userId,
      })

      if (req.body.isPrimary === true) {
        log.info('Setting primary worker address', { userId, addressId: req.params.id })
        const allAddresses = await workersAddress.get(userId)
        for (const address of allAddresses) {
          if (address.id !== req.params.id && address.isPrimary) {
            log.info('Unsetting previous primary address', { userId, addressId: address.id })
            await workersAddress.update({ id: address.id, userId, isPrimary: false })
          }
        }
      }

      log.info('Worker address updated', { userId, addressId: req.params.id })
      res.status(HttpStatus.OK).json({ success: true, data: result })
    } catch (err) { next(err) }
  }
}
