import { HttpStatus } from '@domain/enums/HttpStatus'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'

export interface UpdateRatingInput {
  workerId:     string
  avgRating:    number
  totalReviews: number
}

// Called by Review Service via POST /internal/workers { eventType: 'rating_updated' }
// Kafka migration: becomes consumer of 'review.submitted' topic
export class UpdateWorkerRating {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(dto: UpdateRatingInput): Promise<void> {
    const worker = await this.workerRepo.findById(dto.workerId)
    if (!worker) {
      const err = new Error('Worker not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }

    await this.workerRepo.updateRating(dto.workerId, {
      avgRating:    dto.avgRating,
      totalReviews: dto.totalReviews,
    })
  }
}
