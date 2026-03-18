import {
  WorkerEntity,
  WorkerFullEntity,
  WorkerSearchResult,
} from '../entities/Worker'

export interface CreateWorkerInput {
  id:    string
  email: string
}

export interface UpdateWorkerInput {
  name?:            string
  phone?:           string
  avatar?:          string
  bio?:             string
  experienceYears?: number
  availability?:    string
}

export interface UpdateRatingInput {
  avgRating:    number
  totalReviews: number
}

export interface SearchWorkersInput {
  lat:        number
  lng:        number
  radiusKm:   number
  categoryId?: string
  city?:       string
}

export interface IWorkerRepository {
  findById(id: string): Promise<WorkerEntity | null>
  findFullById(id: string): Promise<WorkerFullEntity | null>
  findByEmail(email: string): Promise<WorkerEntity | null>
  create(data: CreateWorkerInput): Promise<WorkerEntity>
  update(id: string, data: UpdateWorkerInput): Promise<WorkerEntity>
  updateRating(id: string, data: UpdateRatingInput): Promise<void>
  searchNearby(input: SearchWorkersInput): Promise<WorkerSearchResult[]>
  deactivate(id: string): Promise<void>
}
