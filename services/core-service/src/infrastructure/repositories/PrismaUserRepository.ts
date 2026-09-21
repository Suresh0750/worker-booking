import { prisma } from '../config/prisma'
import {
  IUserRepository,
  UpdateUserProfileInput,
} from '@domain/interfaces/IUserRepository'
import { UserProfileEntity } from '@domain/entities/User'
import { toUserProfileEntity } from './mappers'

export class PrismaUserRepository implements IUserRepository {

  async findById(id: string): Promise<UserProfileEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    return user ? toUserProfileEntity(user) : null
  }

  async findByEmail(email: string): Promise<UserProfileEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    return user ? toUserProfileEntity(user) : null
  }

  async update(id: string, data: UpdateUserProfileInput): Promise<UserProfileEntity> {
    const user = await prisma.user.update({
      where: { id },
      data:  {
        ...(data.fullName       !== undefined && { fullName:       data.fullName }),
        ...(data.phone          !== undefined && { phone:          data.phone }),
        ...(data.secondaryPhone !== undefined && { secondaryPhone: data.secondaryPhone }),
        ...(data.gender         !== undefined && { gender:         data.gender }),
        ...(data.dob            !== undefined && { dob:            data.dob }),
        ...(data.profileImage   !== undefined && { profileImage:   data.profileImage }),
      },
    })
    return toUserProfileEntity(user)
  }

  async deactivate(id: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isBlocked: true } })
  }
}

export default new PrismaUserRepository()
