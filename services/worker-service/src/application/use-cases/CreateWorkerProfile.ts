import { IWorkerRepository } from '../../domain/interfaces/IWorkerRepository'
import { CreateWorkerProfileDto, WorkerProfileDto } from '../dtos/WorkerDto'

// Triggered when Auth Service calls POST /internal/workers
// eventType: "create_profile" after a WORKER role user registers
// Kafka migration: becomes consumer of "user.registered" topic filtered by role=WORKER
export class CreateWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(dto: CreateWorkerProfileDto): Promise<WorkerProfileDto> {
    // Idempotent — safe to call multiple times
    const existing = await this.workerRepo.findById(dto.userId)
    if (existing) {
      return this.toDto(existing)
    }

    const worker = await this.workerRepo.create({
      id:               dto.userId,
      userId:           dto.userId,
      email:            dto.email,
      name:             dto.name,
      phone:            dto.phone,
      avatar:           dto.avatar,
      bio:              dto.bio,
      experienceYears:  dto.experienceYears,
      availability:     dto.availability,
    })

    return this.toDto(worker)
  }

  private toDto(worker: any): WorkerProfileDto {
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
      categories:      [],
      addresses:       [],
      portfolios:      [],
    }
  }
}
