import { IPortfolioRepository }     from '../../domain/interfaces/IWorkerAddressRepository'
import { IWorkerAddressRepository }  from '../../domain/interfaces/IWorkerAddressRepository'
import { IWorkerRepository }         from '../../domain/interfaces/IWorkerRepository'
import { AddPortfolioDto, PortfolioDto, AddWorkerAddressDto, WorkerAddressDto } from '../dtos/WorkerDto'

// ── Add Portfolio item ────────────────────────────────────
// Called by Media Service after S3 upload via action-based HTTP
// eventType: "media_uploaded"
export class AddPortfolioItem {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string, dto: AddPortfolioDto): Promise<PortfolioDto> {
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

// ── Delete Portfolio item ─────────────────────────────────
export class DeletePortfolioItem {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(itemId: string, workerId: string): Promise<void> {
    await this.portfolioRepo.delete(itemId, workerId)
  }
}

// ── Add Worker Address ────────────────────────────────────
export class AddWorkerAddress {
  constructor(
    private readonly addressRepo: IWorkerAddressRepository,
    private readonly workerRepo:  IWorkerRepository
  ) {}

  async execute(workerId: string, dto: AddWorkerAddressDto): Promise<WorkerAddressDto> {
    const worker = await this.workerRepo.findById(workerId)
    if (!worker) {
      const err = new Error('Worker not found')
      ;(err as any).status = 404
      throw err
    }

    const existing = await this.addressRepo.findByWorkerId(workerId)
    const isPrimary = dto.isPrimary ?? existing.length === 0

    const address = await this.addressRepo.create({
      ...dto,
      workerId,
      isPrimary,
    })

    return {
      id:        address.id,
      line1:     address.line1,
      line2:     address.line2,
      city:      address.city,
      state:     address.state,
      pincode:   address.pincode,
      lat:       address.lat,
      lng:       address.lng,
      isPrimary: address.isPrimary,
    }
  }
}
