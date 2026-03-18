import { IAuthRepository } from '../../domain/interfaces/IAuthRepository'
import { LogoutRequestDto } from '../dtos/AuthDto'

export class LogoutUser {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(dto: LogoutRequestDto): Promise<void> {
    // Invalidate the specific refresh token — access token expires on its own (15 min)
    await this.authRepo.deleteRefreshToken(dto.refreshToken)
  }

  // Call this for "logout all devices"
  async executeAll(userId: string): Promise<void> {
    await this.authRepo.deleteAllUserTokens(userId)
  }
}
