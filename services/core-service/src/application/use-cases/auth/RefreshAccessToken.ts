import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { HttpStatus } from '@domain/enums/HttpStatus'
import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { RefreshTokenInput } from '../../schemas/AuthSchemas'
import { RefreshResponseDto } from '../../dtos/AuthDto'

export class RefreshAccessToken {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: RefreshTokenInput): Promise<RefreshResponseDto> {
    const record = await this.authRepo.findRefreshToken(dto.refreshToken)

    if (!record || record.expiresAt < new Date()) {
      if (record) await this.authRepo.deleteRefreshToken(dto.refreshToken)
      const err = new Error('Invalid or expired refresh token') as Error & { status?: number }
      err.status = HttpStatus.UNAUTHORIZED
      throw err
    }

    // Rotate — delete old, issue new (prevents token reuse attacks)
    await this.authRepo.deleteRefreshToken(dto.refreshToken)

    const newRefreshToken = uuid()
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? '30')
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    await this.authRepo.saveRefreshToken({
      token:     newRefreshToken,
      userId:    record.userId,
      expiresAt,
    })

    const accessToken = jwt.sign(
      { userId: record.user.id, email: record.user.email, role: record.user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any },
    )

    return { accessToken, refreshToken: newRefreshToken }
  }
}
