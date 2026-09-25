import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { NotFoundError } from '@domain/errors/AppError'
import { WorkerProfileDto } from '../../dtos/WorkerDto'
import { toWorkerProfileDto } from './workerDtoMapper'

export class GetWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  // By worker id (public profile — GET /workers/:id)
  async executeById(workerId: string): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findFullById(workerId)
    if (!worker) throw new NotFoundError('Worker not found')
    return toWorkerProfileDto(worker)
  }

  // By user id (own profile — GET /workers/me)
  async executeByUserId(userId: string): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findFullByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')
    return toWorkerProfileDto(worker)
  }
}
