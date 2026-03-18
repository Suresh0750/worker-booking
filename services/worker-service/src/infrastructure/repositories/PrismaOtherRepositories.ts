import { prisma } from '../config/prisma'
import { IWorkerCategoryRepository } from '../../domain/interfaces/ICategoryRepository'
import {
  IWorkerAddressRepository,
  IPortfolioRepository,
  CreateWorkerAddressInput,
  CreatePortfolioInput,
} from '../../domain/interfaces/IWorkerAddressRepository'
import { CategoryEntity, WorkerAddressEntity, PortfolioEntity } from '../../domain/entities/Worker'

// ── Category Repository ───────────────────────────────────
export class PrismaCategoryRepository implements IWorkerCategoryRepository {
  async findAll(): Promise<CategoryEntity[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } }) as Promise<CategoryEntity[]>
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    return prisma.category.findUnique({ where: { id } }) as Promise<CategoryEntity | null>
  }

  async findByWorkerId(workerId: string): Promise<CategoryEntity[]> {
    const wcs = await prisma.workerCategory.findMany({
      where:   { workerId },
      include: { category: true },
    })
    return wcs.map((wc) => wc.category) as CategoryEntity[]
  }

  async addToWorker(workerId: string, categoryId: string): Promise<void> {
    await prisma.workerCategory.upsert({
      where:  { workerId_categoryId: { workerId, categoryId } },
      update: {},
      create: { workerId, categoryId },
    })
  }

  async removeFromWorker(workerId: string, categoryId: string): Promise<void> {
    await prisma.workerCategory.delete({
      where: { workerId_categoryId: { workerId, categoryId } },
    }).catch(() => {})
  }

  async setWorkerCategories(workerId: string, categoryIds: string[]): Promise<void> {
    // Delete all existing and re-create — cleanest approach
    await prisma.workerCategory.deleteMany({ where: { workerId } })
    await prisma.workerCategory.createMany({
      data: categoryIds.map((categoryId) => ({ workerId, categoryId })),
      skipDuplicates: true,
    })
  }
}

// ── Worker Address Repository ─────────────────────────────
export class PrismaWorkerAddressRepository implements IWorkerAddressRepository {
  async findByWorkerId(workerId: string): Promise<WorkerAddressEntity[]> {
    return prisma.workerAddress.findMany({
      where:   { workerId },
      orderBy: { isPrimary: 'desc' },
    }) as Promise<WorkerAddressEntity[]>
  }

  async findPrimary(workerId: string): Promise<WorkerAddressEntity | null> {
    return prisma.workerAddress.findFirst({
      where: { workerId, isPrimary: true },
    }) as Promise<WorkerAddressEntity | null>
  }

  async create(data: CreateWorkerAddressInput): Promise<WorkerAddressEntity> {
    return prisma.workerAddress.create({
      data: {
        workerId:  data.workerId,
        line1:     data.line1,
        line2:     data.line2,
        city:      data.city,
        state:     data.state,
        pincode:   data.pincode,
        lat:       data.lat,
        lng:       data.lng,
        isPrimary: data.isPrimary ?? false,
      },
    }) as Promise<WorkerAddressEntity>
  }

  async setPrimary(id: string, workerId: string): Promise<void> {
    await prisma.workerAddress.updateMany({ where: { workerId }, data: { isPrimary: false } })
    await prisma.workerAddress.update({ where: { id }, data: { isPrimary: true } })
  }

  async delete(id: string): Promise<void> {
    await prisma.workerAddress.delete({ where: { id } })
  }
}

// ── Portfolio Repository ──────────────────────────────────
export class PrismaPortfolioRepository implements IPortfolioRepository {
  async findByWorkerId(workerId: string): Promise<PortfolioEntity[]> {
    return prisma.portfolio.findMany({
      where:   { workerId },
      orderBy: { uploadedAt: 'desc' },
    }) as Promise<PortfolioEntity[]>
  }

  async create(data: CreatePortfolioInput): Promise<PortfolioEntity> {
    return prisma.portfolio.create({
      data: {
        workerId:  data.workerId,
        mediaUrl:  data.mediaUrl,
        mediaType: data.mediaType as any,
        caption:   data.caption,
      },
    }) as Promise<PortfolioEntity>
  }

  async delete(id: string, workerId: string): Promise<void> {
    await prisma.portfolio.deleteMany({ where: { id, workerId } })
  }
}
