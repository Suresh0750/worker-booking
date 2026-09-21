import { Role } from '@domain/entities/User'
import { Availability, WorkerAddressView } from '@domain/entities/Worker'

export interface AuthUserDto {
  id:    string
  email: string
  role:  Role
}

/** Full user data returned on login — superset of AuthUserDto */
export interface LoginUserDto {
  // identity
  id:             string
  email:          string
  role:           Role
  // user profile
  fullName:       string
  phone:          string
  secondaryPhone: string | null
  gender:         string | null
  dob:            string | null   // ISO date string
  profileImage:   string | null
  // worker-specific (only present when role === 'WORKER')
  workerId?:        string
  bio?:             string | null
  experienceYears?: number
  availability?:    Availability
  isVerified?:      boolean
  // addresses (eager-loaded for workers so the UI can show them immediately)
  addresses?:       WorkerAddressView[]
}

export interface RegisterResponseDto {
  user: AuthUserDto
}

export interface LoginResponseDto {
  accessToken:  string
  refreshToken: string
  user:         LoginUserDto
}

export interface RefreshResponseDto {
  accessToken:  string
  refreshToken: string
}

export interface SendOtpResponseDto {
  sent:       boolean
  expiresIn:  number
  debugCode?: string
}

export interface VerifyOtpResponseDto {
  verified: boolean
}
