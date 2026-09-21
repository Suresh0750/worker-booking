import crypto from 'crypto'
import { OtpEntity } from '@domain/entities/Otp'
import { UserEntity, UserProfileEntity, RefreshTokenEntity, Role } from '@domain/entities/User'
import { CategoryEntity, PortfolioEntity, WorkerEntity, WorkerDocumentEntity, WorkerDocumentType, DocumentStatus, WorkerAddressView, Availability } from '@domain/entities/Worker'

// ─── Auth mappers ──────────────────────────────────────────────────────────────

/**
 * SHA-256 hashes a raw token so only the hash is ever stored.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Converts the domain Role string to the Prisma UserRole enum value.
 * Prisma enums are plain strings at runtime, so no import needed.
 */
export function toPrismaRole(role: string): 'CUSTOMER' | 'WORKER' | 'ADMIN' {
  const valid = ['CUSTOMER', 'WORKER', 'ADMIN'] as const
  const upper = role.toUpperCase() as 'CUSTOMER' | 'WORKER' | 'ADMIN'
  if (!(valid as readonly string[]).includes(upper)) throw new Error(`Unknown role: ${role}`)
  return upper
}

/**
 * Maps a raw Prisma User record to the domain UserEntity.
 */
export function toUserEntity(record: {
  id:           string
  fullName:     string
  email:        string
  phone:        string
  password:     string
  role:         string
  profileImage: string | null
  isBlocked:    boolean
  createdAt:    Date
  updatedAt:    Date
}): UserEntity {
  return {
    id:           record.id,
    fullName:     record.fullName,
    email:        record.email,
    phone:        record.phone,
    passwordHash: record.password,
    role:         record.role as Role,
    profileImage: record.profileImage,
    isBlocked:    record.isBlocked,
    createdAt:    record.createdAt,
    updatedAt:    record.updatedAt,
  }
}

/**
 * Maps a raw Prisma RefreshToken record to the domain RefreshTokenEntity.
 * The plain `token` must be passed in separately since only the hash is stored.
 */
export function toRefreshTokenEntity(
  record: {
    id:        string
    userId:    string
    expiresAt: Date
    createdAt: Date
  },
  plainToken: string,
): RefreshTokenEntity {
  return {
    id:        record.id,
    token:     plainToken,
    userId:    record.userId,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  }
}

/**
 * Maps a raw Prisma OTP record to the domain OtpEntity.
 * Prisma returns `channel` and `purpose` as plain strings, so we cast them
 * to the narrower union types defined in the domain.
 */
export function toOtpEntity(record: {
  id: string
  identifier: string
  channel: string
  purpose: string
  codeHash: string
  expiresAt: Date
  verifiedAt: Date | null
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
}): OtpEntity {
  return {
    id:          record.id,
    identifier:  record.identifier,
    channel:     record.channel as OtpEntity['channel'],
    purpose:     record.purpose as OtpEntity['purpose'],
    codeHash:    record.codeHash,
    expiresAt:   record.expiresAt,
    verifiedAt:  record.verifiedAt,
    attempts:    record.attempts,
    maxAttempts: record.maxAttempts,
    createdAt:   record.createdAt,
    updatedAt:   record.updatedAt,
  }
}

/**
 * Maps a raw Prisma User record to the public-facing UserProfileEntity.
 * Excludes the password hash — safe to return to clients.
 */
export function toUserProfileEntity(record: {
  id:             string
  fullName:       string
  email:          string
  phone:          string
  secondaryPhone: string | null
  role:           string
  gender:         string | null
  dob:            Date | null
  profileImage:   string | null
  isBlocked:      boolean
  createdAt:      Date
  updatedAt:      Date
}): UserProfileEntity {
  return {
    id:             record.id,
    fullName:       record.fullName,
    email:          record.email,
    phone:          record.phone,
    secondaryPhone: record.secondaryPhone,
    role:           record.role as Role,
    gender:         record.gender,
    dob:            record.dob,
    profileImage:   record.profileImage,
    isBlocked:      record.isBlocked,
    createdAt:      record.createdAt,
    updatedAt:      record.updatedAt,
  }
}

/**
 * Maps a raw Prisma Worker record to the domain WorkerEntity.
 * avgRating comes back as a Prisma Decimal — coerce to number.
 */
export function toWorkerEntity(record: {
  id:              string
  userId:          string
  bio:             string | null
  experienceYears: number
  avgRating:       { toNumber(): number } | number
  totalReviews:    number
  availability:    string
  isVerified:      boolean
  isActive:        boolean
  createdAt:       Date
  updatedAt:       Date
}): WorkerEntity {
  return {
    id:              record.id,
    userId:          record.userId,
    bio:             record.bio,
    experienceYears: record.experienceYears,
    avgRating:       typeof record.avgRating === 'number'
                       ? record.avgRating
                       : record.avgRating.toNumber(),
    totalReviews:    record.totalReviews,
    availability:    record.availability as Availability,
    isVerified:      record.isVerified,
    isActive:        record.isActive,
    createdAt:       record.createdAt,
    updatedAt:       record.updatedAt,
  }
}

/**
 * Maps a raw Prisma Address record to the domain WorkerAddressView.
 * lat/lng are stored as Prisma Decimal — coerce to number | null.
 */
export function toAddressEntity(record: {
  id:        string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       { toNumber(): number } | number | null
  lng:       { toNumber(): number } | number | null
  label:     string | null
  isPrimary: boolean
}): WorkerAddressView {
  return {
    id:        record.id,
    line1:     record.line1,
    line2:     record.line2,
    city:      record.city,
    state:     record.state,
    pincode:   record.pincode,
    lat:       record.lat === null ? null
                 : typeof record.lat === 'number' ? record.lat
                 : record.lat.toNumber(),
    lng:       record.lng === null ? null
                 : typeof record.lng === 'number' ? record.lng
                 : record.lng.toNumber(),
    label:     record.label,
    isPrimary: record.isPrimary,
  }
}

/**
 * Maps a raw Prisma Category record to the domain CategoryEntity.
 */
export function toCategoryEntity(record: {
  id:       string
  name:     string
  slug:     string
  icon:     string | null
  isActive: boolean
}): CategoryEntity {
  return {
    id:       record.id,
    name:     record.name,
    slug:     record.slug,
    icon:     record.icon,
    isActive: record.isActive,
  }
}

/**
 * Maps a raw Prisma WorkerDocument record to the domain WorkerDocumentEntity.
 */
export function toWorkerDocumentEntity(record: {
  id:              string
  workerId:        string
  documentType:    string
  documentUrl:     string
  status:          string
  rejectionReason: string | null
  verifiedAt:      Date | null
  createdAt:       Date
  updatedAt:       Date
}): WorkerDocumentEntity {
  return {
    id:              record.id,
    workerId:        record.workerId,
    documentType:    record.documentType    as WorkerDocumentType,
    documentUrl:     record.documentUrl,
    status:          record.status          as DocumentStatus,
    rejectionReason: record.rejectionReason,
    verifiedAt:      record.verifiedAt,
    createdAt:       record.createdAt,
    updatedAt:       record.updatedAt,
  }
}

/**
 * Maps a raw Prisma Portfolio record to the domain PortfolioEntity.
 */
export function toPortfolioEntity(record: {
  id: string
  workerId: string
  mediaUrl: string
  mediaType: string
  caption: string | null
  uploadedAt: Date
}): PortfolioEntity {
  return {
    id:         record.id,
    workerId:   record.workerId,
    mediaUrl:   record.mediaUrl,
    mediaType:  record.mediaType as PortfolioEntity['mediaType'],
    caption:    record.caption,
    uploadedAt: record.uploadedAt,
  }
}
