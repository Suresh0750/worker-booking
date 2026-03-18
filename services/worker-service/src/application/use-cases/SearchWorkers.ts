import { IWorkerRepository } from '../../domain/interfaces/IWorkerRepository'
import { SearchWorkersDto, WorkerSearchItemDto } from '../dtos/WorkerDto'

export class SearchWorkers {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  async execute(dto: SearchWorkersDto): Promise<WorkerSearchItemDto[]> {
    const results = await this.workerRepo.searchNearby({
      lat:        dto.lat,
      lng:        dto.lng,
      radiusKm:   dto.radiusKm  ?? 10,    // Default 10km radius
      categoryId: dto.categoryId,
      city:       dto.city,
    })

    return results.map((w) => ({
      id:              w.id,
      name:            w.name,
      avatar:          w.avatar,
      bio:             w.bio,
      experienceYears: w.experienceYears,
      avgRating:       w.avgRating,
      totalReviews:    w.totalReviews,
      availability:    w.availability,
      isVerified:      w.isVerified,
      distanceKm:      Math.round(w.distanceKm * 10) / 10, // Round to 1 decimal
      city:            w.city,
      categories:      w.categories,
    }))
  }
}
