import { IAuthRepository } from '@domain/interfaces/IAuthRepository'
import { LogoutInput } from '../../schemas/AuthSchemas'

export class LogoutUser {
  constructor(private readonly authRepo: IAuthRepository) {}

  // Logout from current device — invalidates one refresh token
  async execute(dto: LogoutInput): Promise<void> {
    await this.authRepo.deleteRefreshToken(dto.refreshToken)
  }

  // Logout from all devices — invalidates every refresh token for the user
  async executeAll(userId: string): Promise<void> {
    await this.authRepo.deleteAllUserTokens(userId)
  }
}
