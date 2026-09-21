import { CategoryEntity } from '../entities/Worker'

export interface ICategoryRepository {
  findAll(): Promise<CategoryEntity[]>
  findById(id: string): Promise<CategoryEntity | null>
  findByWorkerId(workerId: string): Promise<CategoryEntity[]>
  setWorkerCategories(workerId: string, categoryIds: string[]): Promise<void>
}
