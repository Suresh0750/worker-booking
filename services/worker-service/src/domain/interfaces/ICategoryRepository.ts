import { CategoryEntity } from '../entities/Worker'

export interface IWorkerCategoryRepository {
  findAll(): Promise<CategoryEntity[]>
  findById(id: string): Promise<CategoryEntity | null>
  findByWorkerId(workerId: string): Promise<CategoryEntity[]>
  addToWorker(workerId: string, categoryId: string): Promise<void>
  removeFromWorker(workerId: string, categoryId: string): Promise<void>
  setWorkerCategories(workerId: string, categoryIds: string[]): Promise<void>
}
