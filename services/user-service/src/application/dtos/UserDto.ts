import { z } from 'zod'
import { Role } from '../../domain/entities/User'
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  idParamsSchema,
  createProfileEventSchema,
} from '../schemas/UserSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
export type CreateAddressDto = z.infer<typeof createAddressSchema>
export type UpdateAddressDto = z.infer<typeof updateAddressSchema>
export type IdParamsDto      = z.infer<typeof idParamsSchema>
export type CreateProfileEventDto = z.infer<typeof createProfileEventSchema>

// ── Internal event DTO (kept for use cases) ───────────────
export interface CreateProfileDto {
  userId: string
  email:  string
  role:   string
}

// ── Response DTOs ─────────────────────────────────────────
export interface UserResponseDto {
  id:        string
  email:     string
  name:      string | null
  phone:     string | null
  avatar:    string | null
  role:      Role
  createdAt: Date
}

export interface AddressResponseDto {
  id:        string
  userId:    string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       number | null
  lng:       number | null
  isPrimary: boolean
}
