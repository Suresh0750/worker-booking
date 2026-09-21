// ─────────────────────────────────────────────
// Core domain types
// ─────────────────────────────────────────────

export type Role = 'USER' | 'WORKER' | 'ADMIN' | 'CUSTOMER'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type SlotType = 'SLOT_BASED' | 'REQUEST_BASED' | 'HYBRID'
export type RateType = 'HOURLY' | 'DAILY'

/**
 * Stored in localStorage + held in AuthContext.
 * Populated from the login response — contains everything the UI needs
 * without a follow-up profile fetch.
 */
export interface AuthUser {
  // identity
  id:          string
  email:       string
  role:        Role
  accessToken: string

  // user profile (available for all roles)
  fullName:       string
  phone:          string
  secondaryPhone: string | null
  gender:         string | null
  dob:            string | null   // ISO date string
  profileImage:   string | null

  // worker-specific (only set when role === 'WORKER')
  workerId?:        string
  bio?:             string | null
  experienceYears?: number
  availability?:    Availability
  isVerified?:      boolean

  // addresses eager-loaded for workers
  addresses?: WorkerAddress[]
}

export interface Location {
  lat: number
  lng: number
  address: string
  city: string
}

export interface WorkerProfile {
  id: string
  userId: string
  name: string
  bio: string
  profession: string
  skills: string[]
  rating: number
  reviewCount: number
  rate: number
  rateType: RateType
  location: Location
  slotType: SlotType
  photos: string[]
  isAvailable: boolean
  completedJobs: number
  avatarUrl?: string
  hourlyRate?: number
  dailyRate?: number
}

export interface TimeSlot {
  id: string
  workerId: string
  startTime: string
  endTime: string
  isBooked: boolean
  bookedByName?: string
}

export interface Booking {
  id: string
  clientId: string
  clientName: string
  workerId: string
  worker?: WorkerProfile
  slotId?: string
  jobDescription?: string
  status: BookingStatus
  scheduledAt: string
  location: Location
  totalAmount: number
  createdAt: string
}

export interface JobRequest {
  id: string
  clientId: string
  clientName: string
  workerId: string
  description: string
  location: Location
  budget: number
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: string
}

export interface DashboardStats {
  totalEarnings: number
  thisMonthEarnings: number
  completedJobs: number
  pendingJobs: number
  cancelledJobs: number
  rating: number
  reviewCount: number
  earningsByMonth: { month: string; amount: number }[]
}

export interface SearchFilters {
  query: string
  profession?: string
  city?: string
  lat?: number
  lng?: number
  radiusKm?: number
  minRating?: number
  maxRate?: number
  available?: boolean
}

// ─────────────────────────────────────────────
// API response wrappers
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  errors?: { field: string; message: string }[]
}


export interface ICategory {
  id: string
  name: string
  slug: string
  icon?: string
}

// ─────────────────────────────────────────────
// Worker portal extended types
// ─────────────────────────────────────────────

export type Availability = 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
export type DocumentType = 'AADHAAR' | 'PAN_CARD' | 'DRIVING_LICENSE' | 'PASSPORT' | 'WORK_PERMIT' | 'CERTIFICATE' | 'OTHER'
export type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type MediaType = 'IMAGE' | 'VIDEO'

/** Full merged profile — User fields + Worker fields */
export interface WorkerFullProfile {
  // User fields
  id: string          // User.id
  fullName: string
  email: string
  phone: string
  secondaryPhone?: string
  gender?: string
  dob?: string        // ISO date string
  profileImage?: string
  // Worker fields
  workerId: string
  bio?: string
  experienceYears: number
  avgRating: number
  totalReviews: number
  availability: Availability
  isVerified: boolean
  isActive: boolean
}

export interface WorkerAddress {
  id: string
  userId: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  lat?: number
  lng?: number
  label?: string
  isPrimary: boolean
  createdAt: string
}

export interface ServiceItem {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
}

export interface WorkerService {
  id: string
  workerId: string
  serviceId: string
  price?: number
  isActive: boolean
  service: ServiceItem
  createdAt: string
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
}

export interface WorkerCategory {
  workerId: string
  categoryId: string
  category: CategoryItem
}

export interface PortfolioItem {
  id: string
  workerId: string
  mediaUrl: string
  mediaType: MediaType
  caption?: string
  uploadedAt: string
}

export interface WorkerDocument {
  id: string
  workerId: string
  documentType: DocumentType
  documentUrl: string
  status: DocumentStatus
  rejectionReason?: string
  verifiedAt?: string
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderRole: 'WORKER' | 'CUSTOMER'
  content: string
  createdAt: string
  readAt?: string
}

export interface Conversation {
  id: string
  clientId: string
  clientName: string
  clientAvatar?: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}
