import { Request, Response, NextFunction } from 'express'
import { CreateWorkerProfile }             from '../../application/use-cases/CreateWorkerProfile'
import { GetWorkerProfile }                from '../../application/use-cases/GetWorkerProfile'
import { UpdateWorkerProfile, SetWorkerCategories } from '../../application/use-cases/UpdateWorkerProfile'
import { SearchWorkers }                   from '../../application/use-cases/SearchWorkers'
import { UpdateWorkerRating }              from '../../application/use-cases/UpdateWorkerRating'
import { AddPortfolioItem, DeletePortfolioItem, AddWorkerAddress } from '../../application/use-cases/PortfolioUseCases'
import { PrismaWorkerRepository }          from '../../infrastructure/repositories/PrismaWorkerRepository'
import {
  PrismaCategoryRepository,
  PrismaWorkerAddressRepository,
  PrismaPortfolioRepository,
} from '../../infrastructure/repositories/PrismaOtherRepositories'

// ── Compose dependencies ──────────────────────────────────
const workerRepo   = new PrismaWorkerRepository()
const categoryRepo = new PrismaCategoryRepository()
const addressRepo  = new PrismaWorkerAddressRepository()
const portfolioRepo = new PrismaPortfolioRepository()

const createWorkerProfile = new CreateWorkerProfile(workerRepo)
const getWorkerProfile    = new GetWorkerProfile(workerRepo)
const updateWorkerProfile = new UpdateWorkerProfile(workerRepo)
const setCategories       = new SetWorkerCategories(categoryRepo)
const searchWorkers       = new SearchWorkers(workerRepo)
const updateRating        = new UpdateWorkerRating(workerRepo)
const addPortfolio        = new AddPortfolioItem(portfolioRepo)
const deletePortfolio     = new DeletePortfolioItem(portfolioRepo)
const addAddress          = new AddWorkerAddress(addressRepo, workerRepo)

export class WorkerController {

  // GET /workers/search?lat=&lng=&radiusKm=&categoryId=&city=
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng, radiusKm, categoryId, city } = req.query
      const result = await searchWorkers.execute({
        lat:        parseFloat(lat as string),
        lng:        parseFloat(lng as string),
        radiusKm:   radiusKm   ? parseFloat(radiusKm as string) : undefined,
        categoryId: categoryId as string | undefined,
        city:       city       as string | undefined,
      })
      res.status(200).json({ success: true, data: result, count: result.length })
    } catch (err) { next(err) }
  }

  // GET /workers/categories
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await categoryRepo.findAll()
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/me
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await getWorkerProfile.execute(workerId)
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/:id
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await getWorkerProfile.execute(req.params.id)
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PATCH /workers/me
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await updateWorkerProfile.execute(workerId, req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // PUT /workers/me/categories
  static async setCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      await setCategories.execute(workerId, req.body)
      res.status(200).json({ success: true, message: 'Categories updated' })
    } catch (err) { next(err) }
  }

  // POST /workers/me/addresses
  static async addAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await addAddress.execute(workerId, req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // GET /workers/me/portfolio
  static async getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await portfolioRepo.findByWorkerId(workerId)
      res.status(200).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // POST /workers/me/portfolio
  static async addPortfolioItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      const result   = await addPortfolio.execute(workerId, req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) { next(err) }
  }

  // DELETE /workers/me/portfolio/:id
  static async deletePortfolioItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workerId = (req as any).userId
      await deletePortfolio.execute(req.params.id, workerId)
      res.status(200).json({ success: true, message: 'Portfolio item deleted' })
    } catch (err) { next(err) }
  }

  // POST /internal/workers — called by Auth Service + Review Service + Media Service
  static async handleInternalEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventType, data } = req.body

      const handlers: Record<string, () => Promise<any>> = {
        // Auth Service → create worker profile after WORKER role registers
        create_profile: async () => createWorkerProfile.execute(data),

        // Review Service → update rating after review submitted
        rating_updated: async () => updateRating.execute(data),

        // Media Service → attach portfolio item after S3 upload
        media_uploaded: async () => addPortfolio.execute(data.workerId, {
          mediaUrl:  data.mediaUrl,
          mediaType: data.mediaType,
          caption:   data.caption,
        }),
      }

      const handler = handlers[eventType]
      if (!handler) {
        res.status(400).json({ success: false, message: `Unknown eventType: ${eventType}` })
        return
      }

      const result = await handler()
      res.status(200).json({ success: true, data: result ?? null })
    } catch (err) { next(err) }
  }
}
