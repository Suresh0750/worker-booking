import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { ICategoryRepository } from '@domain/interfaces/ICategoryRepository'
import { NotFoundError, BadRequestError } from '@domain/errors/AppError'
import { UpdateWorkerProfileInput, SetCategoriesInput } from '../../schemas/WorkerSchemas'
import { WorkerProfileDto } from '../../dtos/WorkerDto'
import { toWorkerProfileDto } from './workerDtoMapper'

export class UpdateWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(userId: string, dto: UpdateWorkerProfileInput): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')

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
      throw new BadRequestError('At least one category is required')
    }
    await this.categoryRepo.setWorkerCategories(workerId, dto.categoryIds)
  }
}
