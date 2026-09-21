import { PortfolioEntity } from '../entities/Worker'

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
