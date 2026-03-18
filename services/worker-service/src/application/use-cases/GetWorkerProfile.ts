import { IWorkerRepository } from '../../domain/interfaces/IWorkerRepository'
import { WorkerProfileDto }   from '../dtos/WorkerDto'

export class GetWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(workerId: string): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findFullById(workerId)

    if (!worker) {
      const err = new Error('Worker not found')
      ;(err as any).status = 404
      throw err
    }

    return {
      id:              worker.id,
      email:           worker.email,
      name:            worker.name,
      phone:           worker.phone,
      avatar:          worker.avatar,
      bio:             worker.bio,
      experienceYears: worker.experienceYears,
      avgRating:       worker.avgRating,
      totalReviews:    worker.totalReviews,
      availability:    worker.availability,
      isVerified:      worker.isVerified,
      categories:      worker.categories,
      addresses:       worker.addresses,
      portfolios:      worker.portfolios,
    }
  }
}
