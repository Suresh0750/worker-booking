import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { WorkerProfileDto } from '../../dtos/WorkerDto'
import { toWorkerProfileDto } from './workerDtoMapper'


export interface CreateWorkerProfileInput {
  userId:          string
  bio?:            string
  experienceYears?: number
  availability?:   string
}

// Idempotent — safe to call multiple times (e.g. on retry)
export class CreateWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(input: CreateWorkerProfileInput): Promise<WorkerProfileDto> {
    const existing = await this.workerRepo.findByUserId(input.userId)
    if (existing) {
      const full = await this.workerRepo.findFullByUserId(input.userId)
      return toWorkerProfileDto(full!)
    }

    await this.workerRepo.create({
      userId:          input.userId,
      bio:             input.bio,
      experienceYears: input.experienceYears,
      availability:    input.availability,
    })

    const full = await this.workerRepo.findFullByUserId(input.userId)
    return toWorkerProfileDto(full!)
  }
}
