import { prisma } from '../config/prisma'
import {
  IWorkerDocumentRepository,
  CreateWorkerDocumentInput,
  UpdateWorkerDocumentStatusInput,
} from '@domain/interfaces/IWorkerDocumentRepository'
import { WorkerDocumentEntity } from '@domain/entities/Worker'
import { toWorkerDocumentEntity } from './mappers'

export class PrismaWorkerDocumentRepository implements IWorkerDocumentRepository {

  async findByWorkerId(workerId: string): Promise<WorkerDocumentEntity[]> {
    const rows = await prisma.workerDocument.findMany({
      where:   { workerId },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toWorkerDocumentEntity)
  }

  async findById(id: string): Promise<WorkerDocumentEntity | null> {
    const d = await prisma.workerDocument.findUnique({ where: { id } })
    return d ? toWorkerDocumentEntity(d) : null
  }

  async create(data: CreateWorkerDocumentInput): Promise<WorkerDocumentEntity> {
    const d = await prisma.workerDocument.create({
      data: {
        workerId:     data.workerId,
        documentType: data.documentType as any,
        documentUrl:  data.documentUrl,
      },
    })
    return toWorkerDocumentEntity(d)
  }

  async updateStatus(
    id: string,
    data: UpdateWorkerDocumentStatusInput,
  ): Promise<WorkerDocumentEntity> {
    const d = await prisma.workerDocument.update({
      where: { id },
      data:  {
        status:          data.status as any,
        rejectionReason: data.rejectionReason ?? null,
        verifiedAt:      data.verifiedAt ?? null,
      },
    })
    return toWorkerDocumentEntity(d)
  }

  async delete(id: string, workerId: string): Promise<void> {
    await prisma.workerDocument.deleteMany({ where: { id, workerId } })
  }
}

export default new PrismaWorkerDocumentRepository()
