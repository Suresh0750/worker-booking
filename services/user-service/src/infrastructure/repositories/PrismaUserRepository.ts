import { prisma } from '../config/prisma'
import {
  IUserRepository,
  CreateUserInput,
  UpdateUserInput,
} from '../../domain/interfaces/IUserRepository'
import { UserEntity } from '../../domain/entities/User'

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<UserEntity | null>
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>
  }

  async create(data: CreateUserInput): Promise<UserEntity> {
    return prisma.user.create({
      data: {
        id:    data.id,
        email: data.email,
        role:  data.role as any,
      },
    }) as Promise<UserEntity>
  }

  async update(id: string, data: UpdateUserInput): Promise<UserEntity> {
    return prisma.user.update({
      where: { id },
      data,
    }) as Promise<UserEntity>
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data:  { isActive: false },
    })
  }
}
