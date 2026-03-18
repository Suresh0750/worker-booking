import { NotificationPayload, bookingRoom, userRoom } from '../../domain/entities/Notification'
import { IPushService, ISocketService } from '../../domain/interfaces/INotificationServices'
import { TokenStore } from '../../infrastructure/services/TokenStore'
import { logger }     from '../../infrastructure/config/logger'

// Maps each eventType to a human-readable push notification
const NOTIFICATION_COPY: Record<string, { title: string; body: (data: any) => string }> = {
  booking_created: {
    title: 'New hire request',
    body:  (d) => `You have a new request for booking #${d.bookingId.slice(0, 8)}`,
  },
  booking_status_changed: {
    title: 'Booking update',
    body:  (d) => `Your booking status changed to ${d.status}`,
  },
  booking_cancelled: {
    title: 'Booking cancelled',
    body:  (d) => `Booking #${d.bookingId.slice(0, 8)} has been cancelled`,
  },
  new_message: {
    title: 'New message',
    body:  (d) => d.message ?? 'You have a new message',
  },
  review_submitted: {
    title: 'New review',
    body:  (_d) => 'A customer left you a review',
  },
}

export class NotificationDispatcher {
  constructor(
    private readonly pushService:   IPushService,
    private readonly socketService: ISocketService,
    private readonly tokenStore:    TokenStore,
  ) {}

  async dispatch(payload: NotificationPayload): Promise<void> {
    const { eventType, data } = payload

    try {
      // 1. Emit real-time Socket.io event to booking room
      //    Both user and worker in the booking room receive this instantly
      this.socketService.emitToRoom(
        bookingRoom(data.bookingId),
        eventType,
        data,
      )

      // 2. Determine who receives the push notification
      const recipientId = this.getRecipientId(eventType, data)

      if (!recipientId) {
        logger.warn(`No recipient for eventType: ${eventType}`)
        return
      }

      // 3. Also emit to personal user room — covers users not in booking room
      this.socketService.emitToUser(userRoom(recipientId), eventType, data)

      // 4. Send push notification if user has a registered FCM token
      const tokens = this.tokenStore.getTokens(recipientId)

      if (tokens.length > 0) {
        const copy = NOTIFICATION_COPY[eventType]
        if (copy) {
          await this.pushService.sendMulticast(
            tokens,
            copy.title,
            copy.body(data),
            {
              bookingId: data.bookingId,
              eventType,
            },
          )
        }
      }

      logger.info(`Dispatched [${eventType}] to ${recipientId}`)
    } catch (err: any) {
      logger.error(`Failed to dispatch [${eventType}]: ${err.message}`)
    }
  }

  // Determine who should receive the notification based on event type
  private getRecipientId(eventType: string, data: any): string | null {
    switch (eventType) {
      case 'booking_created':
        return data.workerId   // Worker gets notified when user creates booking

      case 'booking_status_changed':
      case 'booking_cancelled':
        // Notify the opposite party — whoever didn't trigger the change
        // The calling service passes the correct userId/workerId
        return data.userId

      case 'new_message':
        return data.userId     // Caller sets userId to the message recipient

      case 'review_submitted':
        return data.workerId   // Worker gets notified of new review

      default:
        return null
    }
  }
}
