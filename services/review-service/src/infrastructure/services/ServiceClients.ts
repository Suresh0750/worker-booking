import axios from 'axios'
import { IBookingClient, BookingVerifyResponse } from '../../domain/interfaces/IServiceClients'
import { IWorkerClient } from '../../domain/interfaces/IServiceClients'
import { logger } from '../config/logger'

const HEADERS = (secret: string) => ({
  'Content-Type':      'application/json',
  'x-internal-secret': secret,
})

// ── Booking Service Client ────────────────────────────────
export class BookingClient implements IBookingClient {
  private readonly baseUrl: string
  private readonly secret:  string

  constructor() {
    this.baseUrl = process.env.BOOKING_SERVICE_URL ?? 'http://localhost:3004'
    this.secret  = process.env.INTERNAL_SECRET     ?? 'internal'
  }

  async verifyBooking(bookingId: string, userId: string): Promise<BookingVerifyResponse> {
    // Calls Booking Service to verify booking is COMPLETED and userId was the booker
    const response = await axios.post(
      `${this.baseUrl}/internal/bookings/verify`,
      { bookingId, userId },
      { headers: HEADERS(this.secret), timeout: 5000 },
    )
    return response.data.data as BookingVerifyResponse
  }
}

// ── Worker Service Client ─────────────────────────────────
export class WorkerClient implements IWorkerClient {
  private readonly baseUrl: string
  private readonly secret:  string

  constructor() {
    this.baseUrl = process.env.WORKER_SERVICE_URL ?? 'http://localhost:3003'
    this.secret  = process.env.INTERNAL_SECRET    ?? 'internal'
  }

  async updateRating(workerId: string, avgRating: number, totalReviews: number): Promise<void> {
    try {
      // Action-based: eventType maps 1:1 to Kafka topic "review.submitted"
      // Kafka migration: producer.publish('review.submitted', payload)
      await axios.post(
        `${this.baseUrl}/internal/workers`,
        {
          eventType: 'rating_updated',
          data:      { workerId, avgRating, totalReviews },
        },
        { headers: HEADERS(this.secret), timeout: 5000 },
      )
      logger.info(`Rating updated for worker ${workerId}: ${avgRating} (${totalReviews} reviews)`)
    } catch (err: any) {
      // Non-blocking — review is saved even if worker service is temporarily down
      logger.error(`Failed to update worker rating: ${err.message}`)
    }
  }
}
