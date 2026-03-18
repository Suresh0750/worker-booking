import { Role } from '@domain/entities/User'

// ── Request DTOs ──────────────────────────────────────────
export interface RegisterRequestDto {
  email:    string
  password: string
  role?:    'USER' | 'WORKER'
}

export interface LoginRequestDto {
  email:    string
  password: string
}

export interface RefreshTokenRequestDto {
  refreshToken: string
}

export interface LogoutRequestDto {
  refreshToken: string
}

// ── Response DTOs ─────────────────────────────────────────
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
