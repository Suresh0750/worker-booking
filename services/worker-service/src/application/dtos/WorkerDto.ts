import { z } from 'zod'
import { Availability, MediaType } from '@domain/entities/Worker'
import {
  updateProfileSchema,
  searchWorkersSchema,
  addAddressSchema,
  addPortfolioSchema,
  setCategoriesSchema,
  createWorkerProfileDataSchema,
} from '../schemas/WorkerSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type CreateWorkerProfileDto = z.infer<typeof createWorkerProfileDataSchema>
export type UpdateWorkerProfileDto = z.infer<typeof updateProfileSchema>
export type SearchWorkersDto       = z.infer<typeof searchWorkersSchema>
export type SetCategoriesDto       = z.infer<typeof setCategoriesSchema>
export type AddWorkerAddressDto    = z.infer<typeof addAddressSchema>
export type AddPortfolioDto        = z.infer<typeof addPortfolioSchema>

// ── Response DTOs ─────────────────────────────────────────
export interface CategoryDto {
  id:      string
  name:    string
  slug:    string
  iconUrl: string | null
}

export interface WorkerAddressDto {
  id:        string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       number
  lng:       number
  isPrimary: boolean
}

export interface PortfolioDto {
  id:         string
  mediaUrl:   string
  mediaType:  MediaType
  caption:    string | null
  uploadedAt: Date
}

export interface WorkerProfileDto {
  id:              string
  email:           string
  name:            string | null
  phone:           string | null
  avatar:          string | null
  bio:             string | null
  experienceYears: number
  avgRating:       number
  totalReviews:    number
  availability:    Availability
  isVerified:      boolean
  categories:      CategoryDto[]
  addresses:       WorkerAddressDto[]
  portfolios:      PortfolioDto[]
}

export interface WorkerSearchItemDto {
  id:              string
  name:            string | null
  avatar:          string | null
  bio:             string | null
  experienceYears: number
  avgRating:       number
  totalReviews:    number
  availability:    Availability
  isVerified:      boolean
  distanceKm:      number
  city:            string
  categories:      CategoryDto[]
}
