import { WorkerDocumentEntity, WorkerDocumentType, DocumentStatus } from '../entities/Worker'

export interface CreateWorkerDocumentInput {
  workerId:     string
  documentType: WorkerDocumentType
  documentUrl:  string
}

export interface UpdateWorkerDocumentStatusInput {
  status:          DocumentStatus
  rejectionReason?: string
  verifiedAt?:     Date
}

export interface IWorkerDocumentRepository {
  findByWorkerId(workerId: string): Promise<WorkerDocumentEntity[]>
  findById(id: string): Promise<WorkerDocumentEntity | null>
  create(data: CreateWorkerDocumentInput): Promise<WorkerDocumentEntity>
  updateStatus(id: string, data: UpdateWorkerDocumentStatusInput): Promise<WorkerDocumentEntity>
  delete(id: string, workerId: string): Promise<void>
}
