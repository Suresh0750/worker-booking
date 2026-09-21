import { HttpStatus } from '@domain/enums/HttpStatus'
import { IWorkerDocumentRepository } from '@domain/interfaces/IWorkerDocumentRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { UploadDocumentInput, ReviewDocumentInput } from '../../schemas/WorkerSchemas'
import { WorkerDocumentDto } from '../../dtos/WorkerDto'

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

function appError(status: number, message: string): never {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  throw err
}

// ── Upload document ───────────────────────────────────────
export class UploadWorkerDocument {
  constructor(
    private readonly documentRepo: IWorkerDocumentRepository,
    private readonly workerRepo:   IWorkerRepository,
  ) {}

  async execute(userId: string, dto: UploadDocumentInput): Promise<WorkerDocumentDto> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) appError(HttpStatus.NOT_FOUND, 'Worker not found')

    const doc = await this.documentRepo.create({
      workerId:     worker!.id,
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
    if (!worker) appError(HttpStatus.NOT_FOUND, 'Worker not found')

    const docs = await this.documentRepo.findByWorkerId(worker!.id)
    return docs.map(toDto)
  }
}

// ── Review document (admin) ───────────────────────────────
export class ReviewWorkerDocument {
  constructor(private readonly documentRepo: IWorkerDocumentRepository) {}

  async execute(documentId: string, dto: ReviewDocumentInput): Promise<WorkerDocumentDto> {
    const doc = await this.documentRepo.findById(documentId)
    if (!doc) appError(HttpStatus.NOT_FOUND, 'Document not found')

    if (dto.status === 'REJECTED' && !dto.rejectionReason) {
      appError(HttpStatus.BAD_REQUEST, 'Rejection reason is required when rejecting a document')
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
    if (!worker) appError(HttpStatus.NOT_FOUND, 'Worker not found')

    const doc = await this.documentRepo.findById(documentId)
    if (!doc)                    appError(HttpStatus.NOT_FOUND,  'Document not found')
    if (doc!.workerId !== worker!.id) appError(HttpStatus.FORBIDDEN, 'Forbidden')

    await this.documentRepo.delete(documentId, worker!.id)
  }
}
