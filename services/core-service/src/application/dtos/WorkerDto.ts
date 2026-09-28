import { Availability, MediaType, DocumentStatus, WorkerDocumentType } from '@domain/entities/Worker'

export interface CategoryDto {
  id:       string
  name:     string
  slug:     string
  icon:     string | null
  isActive: boolean
}

// ── Portfolio ──────────────────────────────────────────────

export interface PortfolioMediaDto {
  id:        string
  projectId: string
  mediaUrl:  string
  mediaType: MediaType
  caption:   string | null
  createdAt: Date
}

export interface PortfolioProjectDto {
  id:          string
  workerId:    string
  categoryId:  string | null
  categoryName?: string | null
  name:        string
  description: string | null
  createdAt:   Date
  updatedAt:   Date
  mediaCount:  number
  media:       PortfolioMediaDto[]
}

/** @deprecated Kept for compat with legacy flat portfolio response */
export interface PortfolioDto {
  id:         string
  mediaUrl:   string
  mediaType:  MediaType
  caption:    string | null
  uploadedAt: Date
}

// ── Documents ──────────────────────────────────────────────

export interface CreateWorkerDocumentDto {
  id:           string
  documentType: WorkerDocumentType
  documentUrl:  string
  status:       DocumentStatus
}

export interface WorkerDocumentDto extends CreateWorkerDocumentDto {
  rejectionReason: string | null
  verifiedAt:      Date | null
  createdAt:       Date
}

// ── Address ───────────────────────────────────────────────

export interface WorkerAddressDto {
  id:        string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       number | null
  lng:       number | null
  label:     string | null
  isPrimary: boolean
}

// ── Worker profile ────────────────────────────────────────

export interface WorkerProfileDto {
  id:              string
  userId:          string
  fullName:        string
  email:           string
  phone:           string
  profileImage:    string | null
  bio:             string | null
  experienceYears: number
  avgRating:       number
  totalReviews:    number
  availability:    Availability
  isVerified:      boolean
  categories:      CategoryDto[]
  portfolios:      PortfolioDto[]
  documents:       WorkerDocumentDto[]
  addresses:       WorkerAddressDto[]
}

export interface WorkerSearchItemDto {
  id:              string
  userId:          string
  fullName:        string
  profileImage:    string | null
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
