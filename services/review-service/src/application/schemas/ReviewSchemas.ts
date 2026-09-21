import { z } from 'zod'

// ── Body schemas ──────────────────────────────────────────
export const submitReviewSchema = z.object({
  bookingId: z.string().uuid('Valid bookingId required'),
  rating:    z.coerce.number().int().min(1, 'Rating must be a number between 1 and 5').max(5, 'Rating must be a number between 1 and 5'),
  comment:   z.string().min(5, 'Comment must be 5-1000 characters').max(1000, 'Comment must be 5-1000 characters').optional(),
})

// ── Query schemas ─────────────────────────────────────────
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1, 'Page must be a positive number').optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be 1-50').max(50, 'Limit must be 1-50').optional(),
})

// ── Params schemas ────────────────────────────────────────
export const bookingIdParamsSchema = z.object({
  bookingId: z.string().uuid('Valid bookingId required'),
})

export const workerIdParamsSchema = z.object({
  workerId: z.string().uuid('Valid workerId required'),
})

// ── Inferred request types ────────────────────────────────
export type SubmitReviewRequestType = z.infer<typeof submitReviewSchema>
export type PaginationRequestType   = z.infer<typeof paginationSchema>
export type BookingIdParamsType     = z.infer<typeof bookingIdParamsSchema>
export type WorkerIdParamsType      = z.infer<typeof workerIdParamsSchema>
