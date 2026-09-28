import { prisma } from '../config/prisma'
import {
  IPortfolioRepository,
  CreateProjectInput,
  UpdateProjectInput,
  AddMediaInput,
  CreatePortfolioInput,
} from '@domain/interfaces/IPortfolioRepository'
import {
  PortfolioProjectEntity,
  PortfolioMediaEntity,
  PortfolioEntity,
} from '@domain/entities/Worker'
import {
  toPortfolioProjectEntity,
  toPortfolioMediaEntity,
  toPortfolioEntity,
} from './mappers'

const PROJECT_INCLUDE = {
  media: {
    orderBy: { createdAt: 'asc' as const },
  },
} as const

export class PrismaPortfolioRepository implements IPortfolioRepository {

  // ── Projects ────────────────────────────────────────────

  async findProjectsByWorkerId(workerId: string): Promise<PortfolioProjectEntity[]> {
    const projects = await prisma.portfolioProject.findMany({
      where:   { workerId },
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return projects.map(toPortfolioProjectEntity)
  }

  async findProjectById(id: string): Promise<PortfolioProjectEntity | null> {
    const project = await prisma.portfolioProject.findUnique({
      where:   { id },
      include: PROJECT_INCLUDE,
    })
    return project ? toPortfolioProjectEntity(project) : null
  }

  async createProject(data: CreateProjectInput): Promise<PortfolioProjectEntity> {
    const project = await prisma.portfolioProject.create({
      data: {
        workerId:    data.workerId,
        name:        data.name,
        description: data.description ?? null,
        categoryId:  data.categoryId  ?? null,
      },
      include: PROJECT_INCLUDE,
    })
    return toPortfolioProjectEntity(project)
  }

  async updateProject(
    id: string,
    workerId: string,
    data: UpdateProjectInput,
  ): Promise<PortfolioProjectEntity> {
    // ownership check
    const existing = await prisma.portfolioProject.findFirst({ where: { id, workerId } })
    if (!existing) throw new Error('Project not found or not owned by worker')

    const updated = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(data.name        !== undefined && { name:        data.name }),
        ...(data.description !== undefined && { description: data.description }),
        // allow explicitly setting categoryId to null (removes category)
        ...('categoryId' in data && { categoryId: data.categoryId }),
      },
      include: PROJECT_INCLUDE,
    })
    return toPortfolioProjectEntity(updated)
  }

  async deleteProject(id: string, workerId: string): Promise<void> {
    // Cascade in schema deletes all Portfolio media rows too
    await prisma.portfolioProject.deleteMany({ where: { id, workerId } })
  }

  // ── Media ───────────────────────────────────────────────

  async addMedia(data: AddMediaInput): Promise<PortfolioMediaEntity> {
    const item = await prisma.portfolio.create({
      data: {
        projectId: data.projectId,
        mediaUrl:  data.mediaUrl,
        mediaType: data.mediaType as any,
        caption:   data.caption ?? null,
      },
    })
    return toPortfolioMediaEntity(item)
  }

  async deleteMedia(mediaId: string, workerId: string): Promise<void> {
    // Verify ownership via the project's workerId
    const item = await prisma.portfolio.findUnique({
      where:   { id: mediaId },
      include: { project: { select: { workerId: true } } },
    })
    if (!item || item.project.workerId !== workerId) return
    await prisma.portfolio.delete({ where: { id: mediaId } })
  }

  async findMediaById(id: string): Promise<PortfolioMediaEntity | null> {
    const item = await prisma.portfolio.findUnique({ where: { id } })
    return item ? toPortfolioMediaEntity(item) : null
  }

  // ── Legacy (backwards compat) ───────────────────────────

  /** @deprecated */
  async findByWorkerId(workerId: string): Promise<PortfolioEntity[]> {
    const projects = await prisma.portfolioProject.findMany({
      where:   { workerId },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    })
    return projects.flatMap(p =>
      p.media.map(item => toPortfolioEntity(item, workerId)),
    )
  }

  /** @deprecated */
  async create(data: CreatePortfolioInput): Promise<PortfolioEntity> {
    const project = await prisma.portfolioProject.create({
      data: {
        workerId: data.workerId,
        name:     data.caption ?? 'Portfolio Item',
        media: {
          create: {
            mediaUrl:  data.mediaUrl,
            mediaType: data.mediaType as any,
            caption:   data.caption ?? null,
          },
        },
      },
      include: { media: true },
    })
    return toPortfolioEntity(project.media[0], data.workerId)
  }

  /** @deprecated */
  async delete(id: string, workerId: string): Promise<void> {
    const item = await prisma.portfolio.findUnique({
      where:   { id },
      include: { project: true },
    })
    if (!item || item.project.workerId !== workerId) return
    await prisma.portfolioProject.delete({ where: { id: item.projectId } })
  }
}

export default new PrismaPortfolioRepository()
