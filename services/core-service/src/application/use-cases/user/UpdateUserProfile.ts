import { HttpStatus } from '@domain/enums/HttpStatus'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { UpdateProfileInput } from '../../schemas/UserSchemas'
import { UserResponseDto } from '../../dtos/UserDto'

export class UpdateUserProfile {
  constructor(private readonly userRepo: IUserRepository,private readonly workerRepo : IWorkerRepository) {}

  async execute(userId: string, dto: UpdateProfileInput): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      const err = new Error('User not found') as Error & { status?: number }
      err.status = HttpStatus.NOT_FOUND
      throw err
    }

    const updated = await this.userRepo.update(userId, dto)
    if(dto.bio || dto.experienceYears){
      const w = await this.workerRepo.findByUserId(userId);
      const wData = {
        ...(dto.bio             !== undefined && { bio:             dto.bio }),
        ...(dto.experienceYears !== undefined && { experienceYears: dto.experienceYears }),
      }
      await this.workerRepo.update(w?.id!,wData);
    }

    return {
      id:             updated.id,
      fullName:       updated.fullName,
      email:          updated.email,
      phone:          updated.phone,
      secondaryPhone: updated.secondaryPhone,
      role:           updated.role,
      gender:         updated.gender,
      dob:            updated.dob,
      profileImage:   updated.profileImage,
      isBlocked:      updated.isBlocked,
      createdAt:      updated.createdAt,
      ...(dto.bio             !== undefined && { bio:             dto.bio }),
      ...(dto.experienceYears !== undefined && { experienceYears: dto.experienceYears }),
    }
  }
}
