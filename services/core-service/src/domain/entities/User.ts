export type Role = 'CUSTOMER' | 'WORKER' | 'ADMIN'

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WORKER   = 'WORKER',
  ADMIN    = 'ADMIN',
}

// Used internally by auth layer (includes passwordHash)
export interface UserEntity {
  id:           string
  fullName:     string
  email:        string
  phone:        string
  passwordHash: string
  role:         Role
  profileImage: string | null
  isBlocked:    boolean
  createdAt:    Date
  updatedAt:    Date
}

// Full profile returned to clients (no password)
export interface UserProfileEntity {
  id:             string
  fullName:       string
  email:          string
  phone:          string
  secondaryPhone: string | null
  role:           Role
  gender:         string | null
  dob:            Date | null
  profileImage:   string | null
  isBlocked:      boolean
  createdAt:      Date
  updatedAt:      Date
}

export interface RefreshTokenEntity {
  id:        string
  token:     string   // plain token — only in memory, never persisted
  userId:    string
  expiresAt: Date
  createdAt: Date
}
