import { IWorkerRepository }      from '../../domain/interfaces/IWorkerRepository'
import { IWorkerCategoryRepository } from '../../domain/interfaces/ICategoryRepository'
import { UpdateWorkerProfileDto, SetCategoriesDto, WorkerProfileDto } from '../dtos/WorkerDto'

export class UpdateWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(workerId: string, dto: UpdateWorkerProfileDto): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findById(workerId)
    if (!worker) {
      const err = new Error('Worker not found')
      ;(err as any).status = 404
      throw err
    }

    const updated = await this.workerRepo.update(workerId, {
      name:            dto.name,
      phone:           dto.phone,
      avatar:          dto.avatar,
      bio:             dto.bio,
      experienceYears: dto.experienceYears,
      availability:    dto.availability,
    })

    const full = await this.workerRepo.findFullById(workerId)

    return {
      id:              updated.id,
      email:           updated.email,
      name:            updated.name,
      phone:           updated.phone,
      avatar:          updated.avatar,
      bio:             updated.bio,
      experienceYears: updated.experienceYears,
      avgRating:       updated.avgRating,
      totalReviews:    updated.totalReviews,
      availability:    updated.availability,
      isVerified:      updated.isVerified,
      categories:      full?.categories ?? [],
      addresses:       full?.addresses  ?? [],
      portfolios:      full?.portfolios ?? [],
    }
  }
}

// ── Set Categories ────────────────────────────────────────
export class SetWorkerCategories {
  constructor(private readonly categoryRepo: IWorkerCategoryRepository) {}

  async execute(workerId: string, dto: SetCategoriesDto): Promise<void> {
    if (!dto.categoryIds.length) {
      const err = new Error('At least one category is required')
      ;(err as any).status = 400
      throw err
    }
    await this.categoryRepo.setWorkerCategories(workerId, dto.categoryIds)
  }
}
