import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { LoginRequestDto, LoginResponseDto } from '../dtos/AuthDto'

export class LoginUser {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LoginRequestDto): Promise<LoginResponseDto> {
    // 1. Find user — generic error message to prevent email enumeration
    const user = await this.authRepo.findByEmail(dto.email)
    if (!user || !user.isActive) {
      const err = new Error('Invalid email or password')
      ;(err as any).status = 401
      throw err
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isValid) {
      const err = new Error('Invalid email or password')
      ;(err as any).status = 401
      throw err
    }

    // 3. Sign short-lived access token (15 min)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any }
    )

    // 4. Create long-lived refresh token (30 days) — stored in DB for rotation
    const refreshToken = uuid()
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    await this.authRepo.saveRefreshToken({ token: refreshToken, userId: user.id, expiresAt })

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    }
  }
}
