export type Availability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
export type MediaType    = 'IMAGE' | 'VIDEO'

export interface WorkerEntity {
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
  isActive:        boolean
  createdAt:       Date
  updatedAt:       Date
}

export interface CategoryEntity {
  id:      string
  name:    string
  slug:    string
  iconUrl: string | null
}

export interface WorkerAddressEntity {
  id:        string
  workerId:  string
  line1:     string
  line2:     string | null
  city:      string
  state:     string
  pincode:   string
  lat:       number
  lng:       number
  isPrimary: boolean
}

export interface PortfolioEntity {
  id:         string
  workerId:   string
  mediaUrl:   string
  mediaType:  MediaType
  caption:    string | null
  uploadedAt: Date
}

// Worker with all relations — returned in search and profile
export interface WorkerFullEntity extends WorkerEntity {
  addresses:  WorkerAddressEntity[]
  categories: CategoryEntity[]
  portfolios: PortfolioEntity[]
}

// Result from geo search Haversine query
export interface WorkerSearchResult extends WorkerEntity {
  distanceKm:  number
  city:        string
  lat:         number
  lng:         number
  categories:  CategoryEntity[]
}
