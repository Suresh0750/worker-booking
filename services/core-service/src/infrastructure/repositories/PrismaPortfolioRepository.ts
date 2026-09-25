import { prisma } from '../config/prisma'
import { IPortfolioRepository, CreatePortfolioInput } from '@domain/interfaces/IPortfolioRepository'
import { PortfolioEntity } from '@domain/entities/Worker'
import { toPortfolioEntity } from './mappers'

/**
 * PrismaPortfolioRepository
 *
 * The DB schema uses a two-level structure:
 *   PortfolioProject  (owns the workerId, name, description)
 *     └── Portfolio[] (individual media items — image/video per project)
 *
 * The domain/use-case layer treats a portfolio as a flat list of media items,
 * so this repository flattens PortfolioProject → Portfolio into PortfolioEntity[].
 *
 * CreatePortfolioInput creates a PortfolioProject with a single media item.
 * delete() removes the PortfolioProject (cascade deletes its media items too).
 */
export class PrismaPortfolioRepository implements IPortfolioRepository {

  async findByWorkerId(workerId: string): Promise<PortfolioEntity[]> {
    const projects = await prisma.portfolioProject.findMany({
      where:   { workerId },
      include: { media: true },
      orderBy: { createdAt: 'desc' },
    })

    // Flatten: each project may have multiple media items
    return projects.flatMap((project) =>
      project.media.map((item) => toPortfolioEntity(item, workerId)),
    )
  }

  async create(data: CreatePortfolioInput): Promise<PortfolioEntity> {
    // Create a PortfolioProject with one media item in a single transaction
    const project = await prisma.portfolioProject.create({
      data: {
        workerId: data.workerId,
        name:     data.caption ?? 'Portfolio Item',   // name is required by schema
        media: {
          create: {
            mediaUrl:  data.mediaUrl,
            mediaType: data.mediaType as any,
            caption:   data.caption,
          },
        },
      },
      include: { media: true },
    })

    const item = project.media[0]
    return toPortfolioEntity(item, data.workerId)
  }

  async delete(id: string, workerId: string): Promise<void> {
    // `id` here is the Portfolio (media item) id.
    // Find the parent project first to enforce workerId ownership, then
    // delete the project (cascade removes the media item).
    const item = await prisma.portfolio.findUnique({
      where:   { id },
      include: { project: true },
    })

    if (!item || item.project.workerId !== workerId) return   // not found or not owned

    await prisma.portfolioProject.delete({ where: { id: item.projectId } })
  }
}

export default new PrismaPortfolioRepository()
