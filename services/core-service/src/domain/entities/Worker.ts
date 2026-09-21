export type Availability      = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
export type MediaType         = 'IMAGE' | 'VIDEO'
export type DocumentStatus    = 'PENDING' | 'APPROVED' | 'REJECTED'
export type WorkerDocumentType =
  | 'AADHAAR'
  | 'PAN_CARD'
  | 'DRIVING_LICENSE'
  | 'PASSPORT'
  | 'WORK_PERMIT'
  | 'CERTIFICATE'
  | 'OTHER'

// Core worker entity — worker-specific fields only
// name / email / phone / profileImage come from User via join
export interface WorkerEntity {
  id:              string
  userId:          string
  bio:             string | null
  experienceYears: number
  avgRating:       number
  totalReviews:    number
  availability:    Availability
  isVerified:      boolean
  isActive:        boolean
  createdAt:       Date
  updatedAt:       Date
}

export interface CategoryEntity {
  id:       string
  name:     string
  slug:     string
  icon:     string | null
  isActive: boolean
}

export interface PortfolioEntity {
  id:         string
  workerId:   string
  mediaUrl:   string
  mediaType:  MediaType
  caption:    string | null
  uploadedAt: Date
}

export interface WorkerDocumentEntity {
  id:              string
  workerId:        string
  documentType:    WorkerDocumentType
  documentUrl:     string
  status:          DocumentStatus
  rejectionReason: string | null
  verifiedAt:      Date | null
  createdAt:       Date
  updatedAt:       Date
}

// Worker with all relations — used in profile responses
export interface WorkerFullEntity extends WorkerEntity {
  // from User join
  fullName:     string
  email:        string
  phone:        string
  profileImage: string | null
  // relations
  categories:  CategoryEntity[]
  portfolios:  PortfolioEntity[]
  documents:   WorkerDocumentEntity[]
  addresses:   WorkerAddressView[]   // addresses from shared Address table
}

// Flat address view used inside worker profile response
export interface WorkerAddressView {
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

// Geo-search result row
export interface WorkerSearchResult {
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
  lat:             number
  lng:             number
  categories:      CategoryEntity[]
}
