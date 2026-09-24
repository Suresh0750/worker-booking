import { WorkerAddressDto } from '@application/dtos/WorkerDto'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { CreateAddressInput, IAddressRepository } from '@domain/interfaces/IAddressRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { toWorkerAddressDto } from './workerDtoMapper'

export interface UpdateRatingInput {
  workerId:     string
  avgRating:    number
  totalReviews: number
}


 export class WorkersAddress {
  constructor(private readonly workerRepo: IWorkerRepository,private readonly addressRepo : IAddressRepository) {}

  async execute(dto: CreateAddressInput): Promise<WorkerAddressDto> {
    const worker = await this.workerRepo.findByUserId(dto.userId)
    if (!worker) {
      const err = new Error('Worker not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }
    const result = await this.addressRepo.create(dto)
    return toWorkerAddressDto(result)
  }
}

