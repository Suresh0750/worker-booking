import axios from 'axios'
import { IUserServiceClient, CreateProfilePayload } from '../../domain/interfaces/IUserServiceClient'
import { logger } from '../config/logger'

export class UserServiceClient implements IUserServiceClient {
  private readonly baseUrl: string
  private readonly internalSecret: string

  constructor() {
    this.baseUrl        = process.env.USER_SERVICE_URL ?? 'http://localhost:3002'
    this.internalSecret = process.env.INTERNAL_SECRET  ?? 'internal'
  }

  async createProfile(payload: CreateProfilePayload): Promise<void> {
    try {
      // Action-based HTTP call — eventType maps 1:1 to Kafka topic later
      // Migration: replace this axios.post with producer.publish('user.registered', body)
      await axios.post(
        `${this.baseUrl}/internal/users`,
        {
          eventType: 'create_profile',
          data:      payload,
        },
        {
          headers: {
            'Content-Type':     'application/json',
            'x-internal-secret': this.internalSecret,
          },
          timeout: 5000, // 5s timeout — don't block auth if user-service is slow
        }
      )

      logger.info(`Profile creation requested for userId: ${payload.userId}`)
    } catch (error: any) {
      // Non-blocking — auth succeeded even if user-service is temporarily down
      // In production, add a retry queue or dead-letter queue here
      // With Kafka this problem disappears — Kafka guarantees delivery
      logger.error(`Failed to notify user-service: ${error.message}`)
    }
  }
}
