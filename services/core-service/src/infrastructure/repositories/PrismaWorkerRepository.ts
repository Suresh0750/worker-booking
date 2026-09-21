import { prisma } from '../config/prisma'
import {
  IWorkerRepository,
  CreateWorkerInput,
  UpdateWorkerInput,
  UpdateRatingInput,
  SearchWorkersInput,
} from '@domain/interfaces/IWorkerRepository'
import { WorkerEntity, WorkerFullEntity, WorkerSearchResult } from '@domain/entities/Worker'
import {
  toWorkerEntity,
  toCategoryEntity,
  toPortfolioEntity,
  toWorkerDocumentEntity,
  toAddressEntity,
} from './mappers'
 type RawWorkerRow = {
      id:              string
      userId:          string
      fullName:        string
      profileImage:    string | null
      bio:             string | null
      experienceYears: number
      avgRating:       number
      totalReviews:    number
      availability:    string
      isVerified:      boolean
      distanceKm:      number
      city:            string
      lat:             number
      lng:             number
    }
const WORKER_FULL_INCLUDE = {
  user: true,
  workerCategories: { include: { category: true } },
  portfolios:       true,
  documents:        true,
} as const

function buildFullEntity(w: any): WorkerFullEntity {
  return {
    ...toWorkerEntity(w),
    // from User join
    fullName:     w.user.fullName,
    email:        w.user.email,
    phone:        w.user.phone,
    profileImage: w.user.profileImage,
    // relations
    categories: w.workerCategories.map((wc: any) => toCategoryEntity(wc.category)),
    portfolios: w.portfolios.map(toPortfolioEntity),
    documents:  w.documents.map(toWorkerDocumentEntity),
    addresses:  (w.user.addresses ?? []).map((a: any) => ({
      id:        a.id,
      line1:     a.line1,
      line2:     a.line2,
      city:      a.city,
      state:     a.state,
      pincode:   a.pincode,
      lat:       a.lat !== null ? Number(a.lat) : null,
      lng:       a.lng !== null ? Number(a.lng) : null,
      label:     a.label,
      isPrimary: a.isPrimary,
    })),
  }
}

export class PrismaWorkerRepository implements IWorkerRepository {

  async findById(id: string): Promise<WorkerEntity | null> {
    const w = await prisma.worker.findUnique({ where: { id } })
    return w ? toWorkerEntity(w) : null
  }

  async findByUserId(userId: string): Promise<WorkerEntity | null> {
    const w = await prisma.worker.findUnique({ where: { userId } })
    return w ? toWorkerEntity(w) : null
  }

  async findFullById(id: string): Promise<WorkerFullEntity | null> {
    const w = await prisma.worker.findUnique({
      where:   { id },
      include: {
        ...WORKER_FULL_INCLUDE,
        user: { include: { addresses: { orderBy: { isPrimary: 'desc' } } } },
      },
    })
    return w ? buildFullEntity(w) : null
  }

  async findFullByUserId(userId: string): Promise<WorkerFullEntity | null> {
    const w = await prisma.worker.findUnique({
      where:   { userId },
      include: {
        ...WORKER_FULL_INCLUDE,
        user: { include: { addresses: { orderBy: { isPrimary: 'desc' } } } },
      },
    })
    return w ? buildFullEntity(w) : null
  }

  async create(data: CreateWorkerInput): Promise<WorkerEntity> {
    const w = await prisma.worker.create({
      data: {
        userId:          data.userId,
        bio:             data.bio,
        experienceYears: data.experienceYears ?? 0,
        availability:    (data.availability as any) ?? 'AVAILABLE',
      },
    })
    return toWorkerEntity(w)
  }

  async update(id: string, data: UpdateWorkerInput): Promise<WorkerEntity> {
    const w = await prisma.worker.update({
      where: { id },
      data:  {
        ...(data.bio             !== undefined && { bio:             data.bio }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.availability    !== undefined && { availability:    data.availability as any }),
      },
    })
    return toWorkerEntity(w)
  }

  async updateRating(id: string, data: UpdateRatingInput): Promise<void> {
    await prisma.worker.update({
      where: { id },
      data:  { avgRating: data.avgRating, totalReviews: data.totalReviews },
    })
  }

  // Haversine geo-search — joins workers → users → addresses (is_primary = true)
  async searchNearby(input: SearchWorkersInput): Promise<WorkerSearchResult[]> {
    const { lat, lng, radiusKm, categoryId, city } = input

    const workers = await prisma.$queryRaw<any[]>`
      SELECT
        w.id,
        w.user_id          AS "userId",
        u.full_name        AS "fullName",
        u.profile_image    AS "profileImage",
        w.bio,
        w.experience_years AS "experienceYears",
        w.avg_rating       AS "avgRating",
        w.total_reviews    AS "totalReviews",
        w.availability,
        w.is_verified      AS "isVerified",
        a.city,
        CAST(a.lat AS FLOAT) AS lat,
        CAST(a.lng AS FLOAT) AS lng,
        (
          6371 * acos(
            LEAST(1.0,
              cos(radians(${lat})) * cos(radians(CAST(a.lat AS FLOAT)))
              * cos(radians(CAST(a.lng AS FLOAT)) - radians(${lng}))
              + sin(radians(${lat})) * sin(radians(CAST(a.lat AS FLOAT)))
            )
          )
        ) AS "distanceKm"
      FROM workers w
      JOIN users    u ON u.id = w.user_id AND u.is_blocked = false
      JOIN addresses a ON a.user_id = w.user_id AND a.is_primary = true
      WHERE
        w.is_active    = true
        AND w.availability = 'AVAILABLE'
        ${city       ? prisma.$raw`AND LOWER(a.city) = LOWER(${city})`       : prisma.$raw``}
        ${categoryId ? prisma.$raw`AND EXISTS (
          SELECT 1 FROM worker_categories wc
          WHERE wc.worker_id = w.id AND wc.category_id = ${categoryId}
        )` : prisma.$raw``}
      HAVING "distanceKm" <= ${radiusKm}
      ORDER BY "distanceKm" ASC
      LIMIT 50
    `

    if (!workers.length) return []

    // Attach categories in a second query
    const workerIds = workers.map((w:RawWorkerRow) => w.id)
    const wcs = await prisma.workerCategory.findMany({
      where:   { workerId: { in: workerIds } },
      include: { category: true },
    })

   

    type WcRow = (typeof wcs)[number]

    return (workers as RawWorkerRow[]).map((w) => ({
      id:              w.id,
      userId:          w.userId,
      fullName:        w.fullName,
      profileImage:    w.profileImage,
      bio:             w.bio,
      experienceYears: Number(w.experienceYears),
      avgRating:       Number(w.avgRating),
      totalReviews:    Number(w.totalReviews),
      availability:    w.availability as WorkerSearchResult['availability'],
      isVerified:      w.isVerified,
      distanceKm:      Number(w.distanceKm),
      city:            w.city,
      lat:             w.lat,
      lng:             w.lng,
      categories:      wcs
        .filter((wc: WcRow) => wc.workerId === w.id)
        .map((wc: WcRow) => toCategoryEntity(wc.category)),
    }))
  }

  async deactivate(id: string): Promise<void> {
    await prisma.worker.update({ where: { id }, data: { isActive: false } })
  }
}

export default new PrismaWorkerRepository()
