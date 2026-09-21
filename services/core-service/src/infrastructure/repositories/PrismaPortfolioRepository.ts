import { prisma } from '../config/prisma'
import { IPortfolioRepository, CreatePortfolioInput } from '@domain/interfaces/IPortfolioRepository'
import { PortfolioEntity } from '@domain/entities/Worker'
import { toPortfolioEntity } from './mappers'

export class PrismaPortfolioRepository implements IPortfolioRepository {

  async findByWorkerId(workerId: string): Promise<PortfolioEntity[]> {
    const rows = await prisma.portfolio.findMany({
      where:   { workerId },
      orderBy: { uploadedAt: 'desc' },
    })
    return rows.map(toPortfolioEntity)
  }

  async create(data: CreatePortfolioInput): Promise<PortfolioEntity> {
    const p = await prisma.portfolio.create({
      data: {
        workerId:  data.workerId,
        mediaUrl:  data.mediaUrl,
        mediaType: data.mediaType as any,
        caption:   data.caption,
      },
    })
    return toPortfolioEntity(p)
  }

  async delete(id: string, workerId: string): Promise<void> {
    // deleteMany with both id + workerId enforces ownership without extra query
    await prisma.portfolio.deleteMany({ where: { id, workerId } })
  }
}

export default new PrismaPortfolioRepository()
