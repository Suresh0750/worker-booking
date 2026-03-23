import { Availability , MediaType} from '@domain/entities/Worker'
// ── Request DTOs ──────────────────────────────────────────
export interface CreateWorkerProfileDto {
  userId: string
  email:  string
  name?:            string | null
  phone?:           string | null
  avatar?:          string | null
  bio?:             string | null
  experienceYears?: number
  availability?:    Availability
}

export interface UpdateWorkerProfileDto {
  name?:            string
  phone?:           string
  avatar?:          string
  bio?:             string
  experienceYears?: number
  availability?:    Availability
}

export interface SearchWorkersDto {
  lat:         number
  lng:         number
  radiusKm?:   number      // default 10km
  categoryId?: string
  city?:       string
}

export interface SetCategoriesDto {
  categoryIds: string[]
}

export interface AddWorkerAddressDto {
  line1:      string
  line2?:     string
  city:       string
  state:      string
  pincode:    string
  lat:        number
  lng:        number
  isPrimary?: boolean
}

export interface AddPortfolioDto {
  mediaUrl:  string
  mediaType: MediaType
  caption?:  string
}

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
