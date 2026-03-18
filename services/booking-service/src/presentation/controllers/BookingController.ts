import { Request, Response, NextFunction } from 'express'
import { CreateBooking } from '../../application/use-cases/CreateBooking'
import { UpdateBookingStatus } from '../../application/use-cases/UpdateBookingStatus'
import {
  GetBooking,
  GetMyBookings,
  SendMessage,
  UpdateBookingPrice,
} from '../../application/use-cases/BookingUseCases'
import { PrismaBookingRepository } from '../../infrastructure/repositories/PrismaBookingRepository'
import { NotificationClient } from '../../infrastructure/services/NotificationClient'

// ── Compose dependencies ──────────────────────────────────
const bookingRepo        = new PrismaBookingRepository()
const notificationClient = new NotificationClient()

const createBooking       = new CreateBooking(bookingRepo, notificationClient)
const updateStatus        = new UpdateBookingStatus(bookingRepo, notificationClient)
const getBooking          = new GetBooking(bookingRepo)
const getMyBookings       = new GetMyBookings(bookingRepo)
const sendMessage         = new SendMessage(bookingRepo)
const updateBookingPrice  = new UpdateBookingPrice(bookingRepo)

export class BookingController {
  // POST /bookings
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await createBooking.execute(userId, req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /bookings/my?status=&page=&limit=
  static async getMy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId   = (req as any).userId
      const userRole = (req as any).userRole?.toLowerCase() === 'worker' ? 'worker' : 'user'
      const result   = await getMyBookings.execute(userId, userRole, {
        status: req.query.status as any,
        page:   req.query.page  ? parseInt(req.query.page  as string) : undefined,
        limit:  req.query.limit ? parseInt(req.query.limit as string) : undefined,
      })
      res.status(200).json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  }

  // GET /bookings/:id
  static async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await getBooking.execute(req.params.id, userId)
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // PATCH /bookings/:id/status
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await updateStatus.execute(req.params.id, userId, req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // PATCH /bookings/:id/price
  static async updatePrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).userId
      const result = await updateBookingPrice.execute(req.params.id, userId, req.body)
      res.status(200).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /bookings/:id/messages
  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId  = (req as any).userId
      const booking = await getBooking.execute(req.params.id, userId)
      res.status(200).json({ success: true, data: booking.messages })
    } catch (err) {
      next(err)
    }
  }

  // POST /bookings/:id/messages
  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId    = (req as any).userId
      const userRole  = (req as any).userRole ?? 'USER'
      const result    = await sendMessage.execute(req.params.id, userId, userRole, req.body)
      res.status(201).json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  // GET /bookings/:id/logs
  static async getStatusLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await bookingRepo.getStatusLogs(req.params.id)
      res.status(200).json({ success: true, data: logs })
    } catch (err) {
      next(err)
    }
  }
}
