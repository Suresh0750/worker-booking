import { z } from 'zod'
import { Role } from '@domain/entities/User'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  idParamsSchema,
} from '../schemas/AuthSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type RegisterRequestDto     = z.infer<typeof registerSchema>
export type LoginRequestDto        = z.infer<typeof loginSchema>
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>
export type LogoutRequestDto       = z.infer<typeof logoutSchema>
export type IdParamsDto            = z.infer<typeof idParamsSchema>

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
