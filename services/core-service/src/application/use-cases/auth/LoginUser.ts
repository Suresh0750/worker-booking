import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { IWorkerRepository } from '@domain/interfaces/IWorkerRepository'
import { LoginInput } from '../../schemas/AuthSchemas'
import { LoginResponseDto } from '../../dtos/AuthDto'
import { getImageUrl } from '@infrastructure/services/storage.service'

export class LoginUser {
  constructor(
    private readonly authRepo:   IAuthRepository,
    private readonly userRepo:   IUserRepository,
    private readonly workerRepo: IWorkerRepository,
  ) {}

  async execute(dto: LoginInput): Promise<LoginResponseDto> {
    // Generic message — prevents email enumeration
    const user = await this.authRepo.findByEmail(dto.email)
    if (!user || user.isBlocked) {
      this.fail(HttpStatus.UNAUTHORIZED, 'Invalid email or password')
    }

    const isValid = await bcrypt.compare(dto.password, user!.passwordHash)
    if (!isValid) {
      this.fail(HttpStatus.UNAUTHORIZED, 'Invalid email or password')
    }

    // Short-lived access token
    const accessToken = jwt.sign(
      { userId: user!.id, email: user!.email, role: user!.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    )

    // Long-lived refresh token — stored as SHA-256 hash
    const refreshToken = uuid()
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    await this.authRepo.saveRefreshToken({ token: refreshToken, userId: user!.id, expiresAt })

    // Fetch full user profile (includes secondaryPhone, gender, dob, profileImage)
    const profile = await this.userRepo.findById(user!.id)

    // For workers, also fetch worker record + addresses
    let workerExtra: Partial<LoginResponseDto['user']> = {}
    if (user!.role === 'WORKER') {
      const full = await this.workerRepo.findFullByUserId(user!.id)
      if (full) {
        workerExtra = {
          workerId:        full.id,
          bio:             full.bio,
          experienceYears: full.experienceYears,
          availability:    full.availability,
          isVerified:      full.isVerified,
          addresses:       full.addresses,
        }
      }
    }
    const imageUrl = await getImageUrl(profile?.profileImage ?? user!.profileImage!)

    return {
      accessToken,
      refreshToken,
      user: {
        id:             user!.id,
        email:          user!.email,
        role:           user!.role,
        fullName:       profile?.fullName   ?? user!.fullName,
        phone:          profile?.phone      ?? user!.phone,
        secondaryPhone: profile?.secondaryPhone ?? null,
        gender:         profile?.gender     ?? null,
        dob:            profile?.dob        ? (profile.dob as Date).toISOString() : null,
        profileImage:   imageUrl,
        ...workerExtra,
      },
    }
  }

  private fail(status: number, message: string): never {
    const err = new Error(message) as Error & { status?: number }
    err.status = status
    throw err
  }
}
