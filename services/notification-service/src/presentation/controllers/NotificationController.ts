import { Request, Response, NextFunction } from 'express'
import { NotificationDispatcher }          from '../../application/use-cases/NotificationDispatcher'

// Dispatcher is injected from app.ts after Socket.io is set up
let dispatcher: NotificationDispatcher

export const setDispatcher = (d: NotificationDispatcher): void => {
  dispatcher = d
}

export class NotificationController {
  // POST /internal/notify
  // Called by Booking Service, Review Service, etc.
  // Body: { eventType: string, data: { bookingId, userId, workerId, ... } }
  static async notify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventType, data } = req.body

      if (!eventType || !data) {
        res.status(400).json({ success: false, message: 'eventType and data are required' })
        return
      }

      // Dispatch is async but we don't wait — respond immediately to caller
      // This keeps booking/review service response times fast
      dispatcher.dispatch({ eventType, data }).catch(() => {})

      res.status(200).json({ success: true, message: 'Notification queued' })
    } catch (err) {
      next(err)
    }
  }
}
