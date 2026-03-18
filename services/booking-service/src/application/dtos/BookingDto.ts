import { BookingStatus } from '../entities/Booking'

// ── Request DTOs ──────────────────────────────────────────
export interface CreateBookingDto {
  workerId:    string
  categoryId:  string
  description: string
  address:     string
  city:        string
  lat?:        number
  lng?:        number
  scheduledAt?: string
}

export interface UpdateStatusDto {
  status: BookingStatus
  note?:  string
}

export interface UpdatePriceDto {
  priceAgreed: number
}

export interface SendMessageDto {
  content: string
}

export interface GetBookingsDto {
  status?: BookingStatus
  page?:   number
  limit?:  number
}

// ── Response DTOs ─────────────────────────────────────────
export interface BookingResponseDto {
  id:           string
  userId:       string
  workerId:     string
  categoryId:   string
  userName:     string | null
  workerName:   string | null
  categoryName: string | null
  description:  string
  address:      string
  city:         string
  status:       BookingStatus
  priceAgreed:  number | null
  scheduledAt:  Date | null
  createdAt:    Date
  updatedAt:    Date
}

export interface MessageResponseDto {
  id:         string
  bookingId:  string
  senderId:   string
  senderRole: string
  content:    string
  sentAt:     Date
}

export interface BookingListResponseDto {
  data:  BookingResponseDto[]
  total: number
  page:  number
  limit: number
}
