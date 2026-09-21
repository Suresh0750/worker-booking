import { Role } from '@domain/entities/User'

export interface AuthUserDto {
  id:    string
  email: string
  role:  Role
}

export interface RegisterResponseDto {
  user: AuthUserDto
}

export interface LoginResponseDto {
  accessToken:  string
  refreshToken: string
  user:         AuthUserDto
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
