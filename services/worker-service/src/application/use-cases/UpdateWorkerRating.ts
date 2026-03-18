import { IWorkerRepository } from '../../domain/interfaces/IWorkerRepository'

export interface UpdateRatingDto {
  workerId:     string
  avgRating:    number
  totalReviews: number
}

// Called by Review Service after a review is submitted
// Action-based: POST /internal/workers with eventType: "rating_updated"
// Kafka migration: becomes consumer of "review.submitted" topic
export class UpdateWorkerRating {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(dto: UpdateRatingDto): Promise<void> {
    const worker = await this.workerRepo.findById(dto.workerId)
    if (!worker) {
      const err = new Error('Worker not found')
      ;(err as any).status = 404
      throw err
    }

    await this.workerRepo.updateRating(dto.workerId, {
      avgRating:    dto.avgRating,
      totalReviews: dto.totalReviews,
    })
  }
}
