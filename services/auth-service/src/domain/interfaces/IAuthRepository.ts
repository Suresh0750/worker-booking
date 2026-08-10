import { UserEntity, RefreshTokenEntity } from '../entities/User'

export interface CreateUserInput {
  email:        string
  passwordHash: string
  role:         string
  fullName:     string
  phone:        string
}

export interface SaveRefreshTokenInput {
  token:     string
  userId:    string
  expiresAt: Date
}

export interface IAuthRepository {
  // User methods
  findByEmail(email: string): Promise<UserEntity | null>
  findByPhone(phone: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
  create(data: CreateUserInput): Promise<UserEntity>
  deactivate(id: string): Promise<void>

  // Refresh token methods
  saveRefreshToken(data: SaveRefreshTokenInput): Promise<RefreshTokenEntity>
  findRefreshToken(token: string): Promise<(RefreshTokenEntity & { user: UserEntity }) | null>
  deleteRefreshToken(token: string): Promise<void>
  deleteAllUserTokens(userId: string): Promise<void>
}
