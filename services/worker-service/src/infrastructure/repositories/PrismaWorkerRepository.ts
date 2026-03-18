import { prisma } from '../config/prisma'
import {
  IWorkerRepository,
  CreateWorkerInput,
  UpdateWorkerInput,
  UpdateRatingInput,
  SearchWorkersInput,
} from '../../domain/interfaces/IWorkerRepository'
import { WorkerEntity, WorkerFullEntity, WorkerSearchResult } from '../../domain/entities/Worker'

export class PrismaWorkerRepository implements IWorkerRepository {

  async findById(id: string): Promise<WorkerEntity | null> {
    return prisma.worker.findUnique({ where: { id } }) as Promise<WorkerEntity | null>
  }

  async findFullById(id: string): Promise<WorkerFullEntity | null> {
    const worker = await prisma.worker.findUnique({
      where:   { id },
      include: {
        addresses:       true,
        portfolios:      true,
        workerCategories: { include: { category: true } },
      },
    })

    if (!worker) return null

    return {
      ...worker,
      availability: worker.availability as any,
      categories:   worker.workerCategories.map((wc: any) => wc.category),
    } as WorkerFullEntity
  }

  async findByEmail(email: string): Promise<WorkerEntity | null> {
    return prisma.worker.findUnique({ where: { email } }) as Promise<WorkerEntity | null>
  }

  async create(data: CreateWorkerInput): Promise<WorkerEntity> {
    return prisma.worker.create({
      data: { id: data.id, email: data.email },
    }) as Promise<WorkerEntity>
  }

  async update(id: string, data: UpdateWorkerInput): Promise<WorkerEntity> {
    return prisma.worker.update({
      where: { id },
      data:  {
        ...(data.name            && { name: data.name }),
        ...(data.phone           && { phone: data.phone }),
        ...(data.avatar          && { avatar: data.avatar }),
        ...(data.bio             && { bio: data.bio }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.availability    && { availability: data.availability as any }),
      },
    }) as Promise<WorkerEntity>
  }

  async updateRating(id: string, data: UpdateRatingInput): Promise<void> {
    await prisma.worker.update({
      where: { id },
      data:  { avgRating: data.avgRating, totalReviews: data.totalReviews },
    })
  }

  // Haversine formula — finds workers within radiusKm of given lat/lng
  // Formula: 6371 * acos(cos(lat1) * cos(lat2) * cos(lng2-lng1) + sin(lat1) * sin(lat2))
  async searchNearby(input: SearchWorkersInput): Promise<WorkerSearchResult[]> {
    const { lat, lng, radiusKm, categoryId, city } = input

    const workers = await prisma.$queryRaw<any[]>`
      SELECT
        w.id,
        w.email,
        w.name,
        w.avatar,
        w.bio,
        w.experience_years   AS "experienceYears",
        w.avg_rating         AS "avgRating",
        w.total_reviews      AS "totalReviews",
        w.availability,
        w.is_verified        AS "isVerified",
        w.is_active          AS "isActive",
        w.created_at         AS "createdAt",
        w.updated_at         AS "updatedAt",
        a.city,
        a.lat,
        a.lng,
        (
          6371 * acos(
            LEAST(1.0, 
              cos(radians(${lat})) * cos(radians(a.lat))
              * cos(radians(a.lng) - radians(${lng}))
              + sin(radians(${lat})) * sin(radians(a.lat))
            )
          )
        ) AS "distanceKm"
      FROM workers w
      JOIN worker_addresses a ON a.worker_id = w.id AND a.is_primary = true
      WHERE
        w.is_active    = true
        AND w.availability = 'AVAILABLE'
        ${city       ? prisma.$raw`AND LOWER(a.city) = LOWER(${city})` : prisma.$raw``}
        ${categoryId ? prisma.$raw`AND EXISTS (
          SELECT 1 FROM worker_categories wc
          WHERE wc.worker_id = w.id AND wc.category_id = ${categoryId}
        )` : prisma.$raw``}
      HAVING "distanceKm" <= ${radiusKm}
      ORDER BY "distanceKm" ASC
      LIMIT 50
    `

    // Attach categories to each worker
    const workerIds = workers.map((w) => w.id)
    if (!workerIds.length) return []

    const categories = await prisma.workerCategory.findMany({
      where:   { workerId: { in: workerIds } },
      include: { category: true },
    })

    return workers.map((w) => ({
      ...w,
      categories: categories
        .filter((c) => c.workerId === w.id)
        .map((c) => c.category),
    }))
  }

  async deactivate(id: string): Promise<void> {
    await prisma.worker.update({ where: { id }, data: { isActive: false } })
  }
}
