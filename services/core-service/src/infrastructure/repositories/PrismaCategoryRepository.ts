import { prisma } from '../config/prisma'
import { ICategoryRepository } from '@domain/interfaces/ICategoryRepository'
import { CategoryEntity } from '@domain/entities/Worker'
import { toCategoryEntity } from './mappers'

export class PrismaCategoryRepository implements ICategoryRepository {

  async findAll(): Promise<CategoryEntity[]> {
    const rows = await prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return rows.map(toCategoryEntity)
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    const c = await prisma.category.findUnique({ where: { id } })
    return c ? toCategoryEntity(c) : null
  }

  async findByWorkerId(workerId: string): Promise<CategoryEntity[]> {
    const wcs = await prisma.workerCategory.findMany({
      where:   { workerId },
      include: { category: true },
    })
    return wcs.map((wc:any) => toCategoryEntity(wc.category))
  }

  async setWorkerCategories(workerId: string, categoryIds: string[]): Promise<void> {
    // Full replace — delete all then re-create
    await prisma.workerCategory.deleteMany({ where: { workerId } })
    await prisma.workerCategory.createMany({
      data:           categoryIds.map((categoryId) => ({ workerId, categoryId })),
      skipDuplicates: true,
    })
  }
}

export default new PrismaCategoryRepository()
