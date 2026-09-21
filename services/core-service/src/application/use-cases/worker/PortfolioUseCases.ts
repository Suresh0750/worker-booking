import { HttpStatus } from '@domain/enums/HttpStatus'
import { IPortfolioRepository } from '@domain/interfaces/IPortfolioRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { AddPortfolioInput } from '../../schemas/WorkerSchemas'
import { PortfolioDto } from '../../dtos/WorkerDto'

export class AddPortfolioItem {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string, dto: AddPortfolioInput): Promise<PortfolioDto> {
    const item = await this.portfolioRepo.create({
      workerId,
      mediaUrl:  dto.mediaUrl,
      mediaType: dto.mediaType,
      caption:   dto.caption,
    })

    return {
      id:         item.id,
      mediaUrl:   item.mediaUrl,
      mediaType:  item.mediaType,
      caption:    item.caption,
      uploadedAt: item.uploadedAt,
    }
  }
}

export class DeletePortfolioItem {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo:    IWorkerRepository,
  ) {}

  async execute(itemId: string, userId: string): Promise<void> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) {
      const err = new Error('Worker not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }
    // deleteMany with both id + workerId enforces ownership
    await this.portfolioRepo.delete(itemId, worker.id)
  }
}

export class GetPortfolio {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string): Promise<PortfolioDto[]> {
    return this.portfolioRepo.findByWorkerId(workerId)
  }
}
