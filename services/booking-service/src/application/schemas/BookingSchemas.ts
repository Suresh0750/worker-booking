import { z } from 'zod'

const statusSchema = z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
  errorMap: () => ({ message: 'Invalid status' }),
})

// ── Body schemas ──────────────────────────────────────────
export const createBookingSchema = z.object({
  workerId:    z.string().uuid('Valid workerId required'),
  categoryId:  z.string().uuid('Valid categoryId required'),
  description: z.string().min(10, 'Description must be 10-500 chars').max(500, 'Description must be 10-500 chars'),
  address:     z.string().min(1, 'Address is required'),
  city:        z.string().min(1, 'City is required'),
  lat:         z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  lng:         z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'scheduledAt must be a valid date').optional(),
})

export const updateStatusSchema = z.object({
  status: statusSchema,
  note:   z.string().max(200, 'Note max 200 characters').optional(),
})

export const updatePriceSchema = z.object({
  priceAgreed: z.coerce.number().min(0, 'Price must be a positive number'),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message must be 1-1000 chars').max(1000, 'Message must be 1-1000 chars'),
})

// ── Query schemas ─────────────────────────────────────────
export const getBookingsSchema = z.object({
  status: statusSchema.optional(),
  page:   z.coerce.number().int().min(1, 'Page must be a positive number').optional(),
  limit:  z.coerce.number().int().min(1, 'Limit must be 1-50').max(50, 'Limit must be 1-50').optional(),
})

// ── Params schemas ────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid id is required'),
})

// ── Internal event schema ─────────────────────────────────
export const verifyBookingSchema = z.object({
  bookingId: z.string().uuid('Valid bookingId required'),
  userId:    z.string().uuid('Valid userId required'),
})

// ── Inferred request types ────────────────────────────────
export type CreateBookingRequestType = z.infer<typeof createBookingSchema>
export type UpdateStatusRequestType  = z.infer<typeof updateStatusSchema>
export type UpdatePriceRequestType   = z.infer<typeof updatePriceSchema>
export type SendMessageRequestType   = z.infer<typeof sendMessageSchema>
export type GetBookingsRequestType   = z.infer<typeof getBookingsSchema>
export type IdParamsType             = z.infer<typeof idParamsSchema>
