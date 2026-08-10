import { prisma } from '../config/prisma'
import {
  IAuthRepository,
  CreateUserInput,
  SaveRefreshTokenInput,
} from '../../domain/interfaces/IAuthRepository'
import { UserEntity, RefreshTokenEntity } from '../../domain/entities/User'
import {
  hashToken,
  toPrismaRole,
  toRefreshTokenEntity,
  toUserEntity,
} from './PrismaUserMapper'

export class PrismaAuthRepository implements IAuthRepository {

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    return user ? toUserEntity(user) : null
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    return user ? toUserEntity(user) : null
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email:    data.email,
        password: data.passwordHash,
        role:     toPrismaRole(data.role),
        fullName: data.fullName,
        phone:    data.phone,
      },
    })
    return toUserEntity(user)
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isBlocked: true } })
  }

  async saveRefreshToken(data: SaveRefreshTokenInput): Promise<RefreshTokenEntity> {
    const record = await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(data.token),
        userId:    data.userId,
        expiresAt: data.expiresAt,
      },
    })
    return toRefreshTokenEntity(record, data.token)
  }

  async findRefreshToken(
    token: string
  ): Promise<(RefreshTokenEntity & { user: UserEntity }) | null> {
    const record = await prisma.refreshToken.findUnique({
      where:   { tokenHash: hashToken(token) },
      include: { user: true },
    })

    if (!record || record.revokedAt) return null

    return {
      ...toRefreshTokenEntity(record, token),
      user: toUserEntity(record.user),
    }
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { tokenHash: hashToken(token) } }).catch(() => {
      // Silently ignore — token may already be deleted
    })
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  }
}

const authRepo  = new PrismaAuthRepository()

export default authRepo;