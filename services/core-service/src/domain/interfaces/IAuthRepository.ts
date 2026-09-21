import { UserEntity, RefreshTokenEntity } from '../entities/User'

export interface CreateUserInput {
  fullName:     string
  email:        string
  phone:        string
  passwordHash: string
  role:         string
}

export interface SaveRefreshTokenInput {
  token:     string
  userId:    string
  expiresAt: Date
}

export interface IAuthRepository {
  // User credential queries
  findByEmail(email: string): Promise<UserEntity | null>
  findByPhone(phone: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
  create(data: CreateUserInput): Promise<UserEntity>
  deactivate(id: string): Promise<void>

  // Refresh token management
  saveRefreshToken(data: SaveRefreshTokenInput): Promise<RefreshTokenEntity>
  findRefreshToken(token: string): Promise<(RefreshTokenEntity & { user: UserEntity }) | null>
  deleteRefreshToken(token: string): Promise<void>
  deleteAllUserTokens(userId: string): Promise<void>
}
