import { HttpStatus } from '@domain/enums/HttpStatus'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { WorkerProfileDto } from '../../dtos/WorkerDto'
import { toWorkerProfileDto } from './workerDtoMapper'

export class GetWorkerProfile {
  constructor(private readonly workerRepo: IWorkerRepository) {}

  // By worker id (public profile — GET /workers/:id)
  async executeById(workerId: string): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findFullById(workerId)
    if (!worker) this.notFound()
    return toWorkerProfileDto(worker!)
  }

  // By user id (own profile — GET /workers/me)
  async executeByUserId(userId: string): Promise<WorkerProfileDto> {
    const worker = await this.workerRepo.findFullByUserId(userId)
    if (!worker) this.notFound()
    return toWorkerProfileDto(worker!)
  }

  private notFound(): never {
    const err = new Error('Worker not found') as Error & { status?: number }
    err.status = HttpStatus.NOT_FOUND
    throw err
  }
}
