import { WorkerAddressEntity, PortfolioEntity } from '../entities/Worker'

// ── Worker Address ────────────────────────────────────────
export interface CreateWorkerAddressInput {
  workerId:  string
  line1:     string
  line2?:    string
  city:      string
  state:     string
  pincode:   string
  lat:       number
  lng:       number
  isPrimary?: boolean
}

export interface IWorkerAddressRepository {
  findByWorkerId(workerId: string): Promise<WorkerAddressEntity[]>
  findPrimary(workerId: string): Promise<WorkerAddressEntity | null>
  create(data: CreateWorkerAddressInput): Promise<WorkerAddressEntity>
  setPrimary(id: string, workerId: string): Promise<void>
  delete(id: string): Promise<void>
}

// ── Portfolio ─────────────────────────────────────────────
export interface CreatePortfolioInput {
  workerId:  string
  mediaUrl:  string
  mediaType: string
  caption?:  string
}

export interface IPortfolioRepository {
  findByWorkerId(workerId: string): Promise<PortfolioEntity[]>
  create(data: CreatePortfolioInput): Promise<PortfolioEntity>
  delete(id: string, workerId: string): Promise<void>
}
