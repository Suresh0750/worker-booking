import { Availability, MediaType, DocumentStatus, WorkerDocumentType } from '@domain/entities/Worker'

export interface CategoryDto {
  id:       string
  name:     string
  slug:     string
  icon:     string | null
  isActive: boolean
}

export interface PortfolioDto {
  id:         string
  mediaUrl:   string
  mediaType:  MediaType
  caption:    string | null
  uploadedAt: Date
}

export interface WorkerDocumentDto {
  id:              string
  documentType:    WorkerDocumentType
  documentUrl:     string
  status:          DocumentStatus
  rejectionReason: string | null
  verifiedAt:      Date | null
  createdAt:       Date
}

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
