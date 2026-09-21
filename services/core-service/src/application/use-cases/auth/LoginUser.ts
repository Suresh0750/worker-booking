import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { LoginInput } from '../../schemas/AuthSchemas'
import { LoginResponseDto } from '../../dtos/AuthDto'

export class LoginUser {
  constructor(private readonly authRepo: IAuthRepository) {}

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

    return {
      accessToken,
      refreshToken,
      user: { id: user!.id, email: user!.email, role: user!.role },
    }
  }

  private fail(status: number, message: string): never {
    const err = new Error(message) as Error & { status?: number }
    err.status = status
    throw err
  }
}
