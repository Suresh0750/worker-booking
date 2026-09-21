import { WorkerEntity, WorkerFullEntity, WorkerSearchResult } from '../entities/Worker'

export interface CreateWorkerInput {
  userId:          string
  bio?:            string
  experienceYears?: number
  availability?:   string
}

export interface UpdateWorkerInput {
  bio?:            string
  experienceYears?: number
  availability?:   string
}

export interface UpdateRatingInput {
  avgRating:    number
  totalReviews: number
}

export interface SearchWorkersInput {
  lat:         number
  lng:         number
  radiusKm:    number
  categoryId?: string
  city?:       string
}

export interface IWorkerRepository {
  findById(id: string): Promise<WorkerEntity | null>
  findByUserId(userId: string): Promise<WorkerEntity | null>
  findFullByUserId(userId: string): Promise<WorkerFullEntity | null>
  findFullById(id: string): Promise<WorkerFullEntity | null>
  create(data: CreateWorkerInput): Promise<WorkerEntity>
  update(id: string, data: UpdateWorkerInput): Promise<WorkerEntity>
  updateRating(id: string, data: UpdateRatingInput): Promise<void>
  searchNearby(input: SearchWorkersInput): Promise<WorkerSearchResult[]>
  deactivate(id: string): Promise<void>
}
