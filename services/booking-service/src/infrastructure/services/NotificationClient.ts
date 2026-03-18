import axios from 'axios'
import { INotificationClient, NotifyPayload } from '../../domain/interfaces/INotificationClient'
import { logger } from '../config/logger'

export class NotificationClient implements INotificationClient {
  private readonly baseUrl: string
  private readonly secret: string

  constructor() {
    this.baseUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3007'
    this.secret  = process.env.INTERNAL_SECRET          ?? 'internal'
  }

  async notify(payload: NotifyPayload): Promise<void> {
    try {
      // Action-based call → Kafka migration: producer.publish(payload.eventType, payload.data)
      await axios.post(
        `${this.baseUrl}/internal/notify`,
        payload,
        {
          headers: { 'x-internal-secret': this.secret },
          timeout: 3000,
        },
      )
    } catch (err: any) {
      // Non-blocking — booking succeeds even if notification fails
      logger.error(`Failed to notify: ${err.message}`)
    }
  }
}
