import { PortfolioProjectEntity, PortfolioMediaEntity } from '../entities/Worker'

// ── Inputs ────────────────────────────────────────────────

export interface CreateProjectInput {
  workerId:    string
  name:        string
  description?: string
  categoryId?: string
}

export interface UpdateProjectInput {
   categoryId?: string | null | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
}

export interface AddMediaInput {
  projectId: string
  mediaUrl:  string
  mediaType: string
  caption?:  string
}

/** @deprecated use CreateProjectInput + AddMediaInput */
export interface CreatePortfolioInput {
  workerId:  string
  mediaUrl:  string
  mediaType: string
  caption?:  string
}

// ── Repository interface ──────────────────────────────────

export interface IPortfolioRepository {
  // ── Projects ──────────────────────────────────────────
  findProjectsByWorkerId(workerId: string): Promise<PortfolioProjectEntity[]>
  findProjectById(id: string): Promise<PortfolioProjectEntity | null>
  createProject(data: CreateProjectInput): Promise<PortfolioProjectEntity>
  updateProject(id: string, workerId: string, data: UpdateProjectInput): Promise<PortfolioProjectEntity>
  deleteProject(id: string, workerId: string): Promise<void>

  // ── Media within a project ────────────────────────────
  addMedia(data: AddMediaInput): Promise<PortfolioMediaEntity>
  deleteMedia(mediaId: string, workerId: string): Promise<void>
  findMediaById(id: string): Promise<PortfolioMediaEntity | null>

  // ── Legacy (kept for compat) ──────────────────────────
  /** @deprecated */
  findByWorkerId(workerId: string): Promise<any[]>
  /** @deprecated */
  create(data: CreatePortfolioInput): Promise<any>
  /** @deprecated */
  delete(id: string, workerId: string): Promise<void>
}
