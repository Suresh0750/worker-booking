import crypto from 'crypto'
import { User as PrismaUser, UserRole, RefreshToken as PrismaRefreshToken } from '@prisma/client'
import { UserEntity, RefreshTokenEntity, Role } from '../../domain/entities/User'

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function toDomainRole(role: UserRole): Role {
  return role as Role
}

export function toPrismaRole(role: string): UserRole {
  const normalized = role.toUpperCase()
  if (normalized === 'USER') return 'CUSTOMER'
  return normalized as UserRole
}

export function toUserEntity(user: PrismaUser): UserEntity {
  return {
    id:           user.id,
    email:        user.email,
    passwordHash: user.password,
    role:         toDomainRole(user.role),
    isActive:     !user.isBlocked,
    createdAt:    user.createdAt,
    updatedAt:    user.updatedAt,
  }
}

export function toRefreshTokenEntity(
  record: PrismaRefreshToken,
  plainToken: string
): RefreshTokenEntity {
  return {
    id:        record.id,
    token:     plainToken,
    userId:    record.userId,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  }
}
