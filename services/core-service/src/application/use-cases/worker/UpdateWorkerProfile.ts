import { HttpStatus } from '@domain/enums/HttpStatus'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { ICategoryRepository } from '@domain/interfaces/ICategoryRepository'
import { UpdateWorkerProfileInput, SetCategoriesInput } from '../../schemas/WorkerSchemas'
import { WorkerProfileDto } from '../../dtos/WorkerDto'
import { toWorkerProfileDto } from './workerDtoMapper'

export class UpdateWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(userId: string, dto: UpdateWorkerProfileInput): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) {
      const err = new Error('Worker not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }

    await this.workerRepo.update(worker.id, {
      bio:             dto.bio,
      experienceYears: dto.experienceYears,
      availability:    dto.availability,
    })

    const full = await this.workerRepo.findFullByUserId(userId)
    return toWorkerProfileDto(full!)
  }
}

export class SetWorkerCategories {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(workerId: string, dto: SetCategoriesInput): Promise<void> {
    if (!dto.categoryIds.length) {
      const err = new Error('At least one category is required') as Error & { status?: number }
      err.status = HttpStatus.BAD_REQUEST
      throw err
    }
    await this.categoryRepo.setWorkerCategories(workerId, dto.categoryIds)
  }
}
