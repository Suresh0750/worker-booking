import { IWorkerDocumentRepository } from '@domain/interfaces/IWorkerDocumentRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '@domain/errors/AppError'
import { UploadDocumentInput, ReviewDocumentInput } from '../../schemas/WorkerSchemas'
import { CreateWorkerDocumentDto, WorkerDocumentDto } from '../../dtos/WorkerDto'
import { deleteImage } from '@infrastructure/services/storage.service'

function toDto(d: any): WorkerDocumentDto {
  return {
    id:              d.id,
    documentType:    d.documentType,
    documentUrl:     d.documentUrl,
    status:          d.status,
    rejectionReason: d.rejectionReason,
    verifiedAt:      d.verifiedAt,
    createdAt:       d.createdAt,
  }
}

// ── Upload document ───────────────────────────────────────
export class UploadWorkerDocument {
  constructor(
    private readonly documentRepo: IWorkerDocumentRepository,
    private readonly workerRepo:   IWorkerRepository,
  ) {}

  async execute(userId: string, dto: CreateWorkerDocumentDto): Promise<WorkerDocumentDto> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')

    const doc = await this.documentRepo.create({
      workerId:     worker.id,
      documentType: dto.documentType as any,
      documentUrl:  dto.documentUrl,
    })

    return toDto(doc)
  }
}

// ── Get documents ─────────────────────────────────────────
export class GetWorkerDocuments {
  constructor(
    private readonly documentRepo: IWorkerDocumentRepository,
    private readonly workerRepo:   IWorkerRepository,
  ) {}

  async execute(userId: string): Promise<WorkerDocumentDto[]> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')

    const docs = await this.documentRepo.findByWorkerId(worker.id)
    return docs.map(toDto)
  }
}

// ── Review document (admin) ───────────────────────────────
export class ReviewWorkerDocument {
  constructor(private readonly documentRepo: IWorkerDocumentRepository) {}

  async execute(documentId: string, dto: ReviewDocumentInput): Promise<WorkerDocumentDto> {
    const doc = await this.documentRepo.findById(documentId)
    if (!doc) throw new NotFoundError('Document not found')

    if (dto.status === 'REJECTED' && !dto.rejectionReason) {
      throw new BadRequestError('Rejection reason is required when rejecting a document')
    }

    const updated = await this.documentRepo.updateStatus(documentId, {
      status:          dto.status as any,
      rejectionReason: dto.rejectionReason,
      verifiedAt:      dto.status === 'APPROVED' ? new Date() : undefined,
    })

    return toDto(updated)
  }
}

// ── Delete document ───────────────────────────────────────
export class DeleteWorkerDocument {
  constructor(
    private readonly documentRepo: IWorkerDocumentRepository,
    private readonly workerRepo:   IWorkerRepository,
  ) {}

  async execute(documentId: string, userId: string): Promise<void> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')

    const doc = await this.documentRepo.findById(documentId)
    if (!doc)                         throw new NotFoundError('Document not found')
    if (doc.workerId !== worker.id)   throw new ForbiddenError('Forbidden')

    await this.documentRepo.delete(documentId, worker.id)
    await deleteImage(doc.documentUrl);
  }
}
