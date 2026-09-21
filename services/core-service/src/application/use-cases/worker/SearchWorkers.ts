import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { SearchWorkersInput } from '../../schemas/WorkerSchemas'
import { WorkerSearchItemDto } from '../../dtos/WorkerDto'

export class SearchWorkers {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(dto: SearchWorkersInput): Promise<WorkerSearchItemDto[]> {
    const results = await this.workerRepo.searchNearby({
      lat:        dto.lat,
      lng:        dto.lng,
      radiusKm:   dto.radiusKm ?? 10,
      categoryId: dto.categoryId,
      city:       dto.city,
    })

    return results.map((w) => ({
      id:              w.id,
      userId:          w.userId,
      fullName:        w.fullName,
      profileImage:    w.profileImage,
      bio:             w.bio,
      experienceYears: w.experienceYears,
      avgRating:       Number(w.avgRating),
      totalReviews:    w.totalReviews,
      availability:    w.availability,
      isVerified:      w.isVerified,
      distanceKm:      Math.round(w.distanceKm * 10) / 10,
      city:            w.city,
      categories:      w.categories,
    }))
  }
}
