import { prisma } from '../config/prisma'
import {
  IAuthRepository,
  CreateUserInput,
  SaveRefreshTokenInput,
} from '../../domain/interfaces/IAuthRepository'
import { UserEntity, RefreshTokenEntity } from '../../domain/entities/User'

export class PrismaAuthRepository implements IAuthRepository {

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    return prisma.user.create({
      data: {
        email:        data.email,
        passwordHash: data.passwordHash,
        role:         data.role as any,
      },
    }) as Promise<UserEntity>
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isActive: false } })
  }

  async saveRefreshToken(data: SaveRefreshTokenInput): Promise<RefreshTokenEntity> {
    return prisma.refreshToken.create({
      data: {
        token:     data.token,
        userId:    data.userId,
        expiresAt: data.expiresAt,
      },
    }) as Promise<RefreshTokenEntity>
  }

  async findRefreshToken(
    token: string
  ): Promise<(RefreshTokenEntity & { user: UserEntity }) | null> {
    return prisma.refreshToken.findUnique({
      where:   { token },
      include: { user: true },
    }) as any
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { token } }).catch(() => {
      // Silently ignore — token may already be deleted
    })
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  }
}
