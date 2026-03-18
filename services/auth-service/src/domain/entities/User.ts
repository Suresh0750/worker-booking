export type Role = 'USER' | 'WORKER' | 'ADMIN'

export interface UserEntity {
  id:           string
  email:        string
  passwordHash: string
  role:         Role
  isActive:     boolean
  createdAt:    Date
  updatedAt:    Date
}

export interface RefreshTokenEntity {
  id:        string
  token:     string
  userId:    string
  expiresAt: Date
  createdAt: Date
}
