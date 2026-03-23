import axios from 'axios'
import {
  IWorkerServiceClient,
  CreateWorkerProfilePayload,
} from '../../domain/interfaces/IWorkerServiceClient'
import { logger } from '../config/logger'

export class WorkerServiceClient implements IWorkerServiceClient {
  private readonly baseUrl: string
  private readonly internalSecret: string

  constructor() {
    this.baseUrl        = process.env.WORKER_SERVICE_URL ?? 'http://localhost:3003'
    this.internalSecret = process.env.INTERNAL_SECRET   ?? 'internal'
  }

  async createWorkerProfile(payload: CreateWorkerProfilePayload): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/internal/workers`,
        {
          eventType: 'create_profile',
          data:      payload,
        },
        {
          headers: {
            'Content-Type':      'application/json',
            'x-internal-secret': this.internalSecret,
          },
          timeout: 5000,
        }
      )
      logger.info(`Worker profile creation requested for userId: ${payload.userId}`)
    } catch (error: any) {
      logger.error(`Failed to notify worker-service: ${error.message}`)
    }
  }
}
