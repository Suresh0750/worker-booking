// ─────────────────────────────────────────────
// Core domain types
// ─────────────────────────────────────────────

export type Role = 'USER' | 'WORKER' | 'ADMIN'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type SlotType = 'SLOT_BASED' | 'REQUEST_BASED' | 'HYBRID'
export type RateType = 'HOURLY' | 'DAILY'

export interface AuthUser {
  id: string
  email: string
  role: Role
  accessToken: string
  refreshToken: string
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
