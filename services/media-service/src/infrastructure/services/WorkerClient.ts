import axios from 'axios'
import { IWorkerClient } from '../../domain/interfaces/IServiceInterfaces'
import { logger }        from '../config/logger'

export class WorkerClient implements IWorkerClient {
  private readonly baseUrl: string
  private readonly secret:  string

  constructor() {
    this.baseUrl = process.env.WORKER_SERVICE_URL ?? 'http://localhost:3003'
    this.secret  = process.env.INTERNAL_SECRET    ?? 'internal'
  }

  async attachPortfolio(payload: {
    workerId:  string
    mediaUrl:  string
    mediaType: string
    caption?:  string
  }): Promise<void> {
    try {
      // Action-based: POST /internal/workers
      // eventType: "media_uploaded" → Worker Service attaches to portfolio
      // Kafka migration: producer.publish('media.uploaded', payload)
      await axios.post(
        `${this.baseUrl}/internal/workers`,
        {
          eventType: 'media_uploaded',
          data:      payload,
        },
        {
          headers: {
            'Content-Type':      'application/json',
            'x-internal-secret': this.secret,
          },
          timeout: 5000,
        },
      )
      logger.info(`Portfolio attached for worker ${payload.workerId}`)
    } catch (err: any) {
      // Non-blocking — upload succeeds even if worker service is down
      logger.error(`Failed to attach portfolio: ${err.message}`)
    }
  }
}
