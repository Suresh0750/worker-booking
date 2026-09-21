import { z } from 'zod'
import { BookingStatus } from '../../domain/entities/Booking'
import {
  createBookingSchema,
  updateStatusSchema,
  updatePriceSchema,
  sendMessageSchema,
  getBookingsSchema,
} from '../schemas/BookingSchemas'

// ── Request types — derived from Zod schemas (single source of truth) ──
export type CreateBookingDto = z.infer<typeof createBookingSchema>
export type UpdateStatusDto  = z.infer<typeof updateStatusSchema>
export type UpdatePriceDto   = z.infer<typeof updatePriceSchema>
export type SendMessageDto   = z.infer<typeof sendMessageSchema>
export type GetBookingsDto   = z.infer<typeof getBookingsSchema>

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
