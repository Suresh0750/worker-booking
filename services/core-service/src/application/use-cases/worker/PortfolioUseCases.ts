import { IPortfolioRepository } from '@domain/interfaces/IPortfolioRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { NotFoundError, BadRequestError } from '@domain/errors/AppError'
import {
  CreateProjectInput,
  UpdateProjectInput,
  AddPortfolioInput,
} from '../../schemas/WorkerSchemas'
import { PortfolioProjectDto, PortfolioMediaDto } from '../../dtos/WorkerDto'
import { ICategoryRepository } from '@domain/interfaces/ICategoryRepository'

// ── Helpers ────────────────────────────────────────────────

function toMediaDto(m: {
  id: string; projectId: string; mediaUrl: string
  mediaType: string; caption: string | null; createdAt: Date
}): PortfolioMediaDto {
  return {
    id:        m.id,
    projectId: m.projectId,
    mediaUrl:  m.mediaUrl,
    mediaType: m.mediaType as PortfolioMediaDto['mediaType'],
    caption:   m.caption,
    createdAt: m.createdAt,
  }
}

function toProjectDto(
  p: {
    id: string; workerId: string; categoryId: string | null
    name: string; description: string | null
    createdAt: Date; updatedAt: Date
    media: Array<{ id: string; projectId: string; mediaUrl: string; mediaType: string; caption: string | null; createdAt: Date }>
  },
  categoryName?: string | null,
): PortfolioProjectDto {
  return {
    id:           p.id,
    workerId:     p.workerId,
    categoryId:   p.categoryId,
    categoryName: categoryName ?? null,
    name:         p.name,
    description:  p.description,
    createdAt:    p.createdAt,
    updatedAt:    p.updatedAt,
    mediaCount:   p.media.length,
    media:        p.media.map(toMediaDto),
  }
}

// ── Use cases ──────────────────────────────────────────────

export class GetPortfolioProjects {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string): Promise<PortfolioProjectDto[]> {
    const projects = await this.portfolioRepo.findProjectsByWorkerId(workerId)
    return projects.map(p => toProjectDto(p))
  }
}

export class CreatePortfolioProject {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string, dto: CreateProjectInput): Promise<PortfolioProjectDto> {
    const project = await this.portfolioRepo.createProject({
      workerId,
      name:        dto.name,
      description: dto.description,
      categoryId:  dto.categoryId,
    })
    return toProjectDto(project)
  }
}

export class UpdatePortfolioProject {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(
    projectId: string,
    workerId: string,
    dto: UpdateProjectInput,
  ): Promise<PortfolioProjectDto> {
    const project = await this.portfolioRepo.updateProject(projectId, workerId, dto)
    return toProjectDto(project)
  }
}

export class DeletePortfolioProject {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo:    IWorkerRepository,
  ) {}

  async execute(projectId: string, userId: string): Promise<void> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')
    await this.portfolioRepo.deleteProject(projectId, worker.id)
  }
}

export class AddMediaToProject {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo:    IWorkerRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    dto: { mediaUrl: string; mediaType: string; caption?: string },
  ): Promise<PortfolioMediaDto> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')

    // verify project belongs to this worker
    const project = await this.portfolioRepo.findProjectById(projectId)
    if (!project || project.workerId !== worker.id) throw new NotFoundError('Project not found')

    const media = await this.portfolioRepo.addMedia({
      projectId,
      mediaUrl:  dto.mediaUrl,
      mediaType: dto.mediaType,
      caption:   dto.caption,
    })
    return toMediaDto(media)
  }
}

export class DeleteMediaFromProject {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo:    IWorkerRepository,
  ) {}

  async execute(mediaId: string, userId: string): Promise<void> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')
    await this.portfolioRepo.deleteMedia(mediaId, worker.id)
  }
}

// ── Legacy use-cases (kept so existing controller imports compile) ────────────

export class AddPortfolioItem {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string, dto: AddPortfolioInput): Promise<any> {
    const item = await this.portfolioRepo.create({ workerId, ...dto })
    return {
      id:         item.id,
      mediaUrl:   item.mediaUrl,
      mediaType:  item.mediaType,
      caption:    item.caption,
      uploadedAt: item.uploadedAt,
    }
  }
}

export class DeletePortfolioItem {
  constructor(
    private readonly portfolioRepo: IPortfolioRepository,
    private readonly workerRepo:    IWorkerRepository,
  ) {}

  async execute(itemId: string, userId: string): Promise<void> {
    const worker = await this.workerRepo.findByUserId(userId)
    if (!worker) throw new NotFoundError('Worker not found')
    await this.portfolioRepo.delete(itemId, worker.id)
  }
}

export class GetPortfolio {
  constructor(private readonly portfolioRepo: IPortfolioRepository) {}

  async execute(workerId: string): Promise<any[]> {
    return this.portfolioRepo.findByWorkerId(workerId)
  }
}
