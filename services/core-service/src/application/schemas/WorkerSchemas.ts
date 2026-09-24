import { z } from 'zod'

const PHONE_REGEX   = /^\+?[1-9]\d{7,14}$/
const PINCODE_REGEX = /^\d{6}$/

export const availabilitySchema = z.enum(['AVAILABLE', 'BUSY', 'UNAVAILABLE'], {
  errorMap: () => ({ message: 'Invalid availability value' }),
})

export const mediaTypeSchema = z.enum(['IMAGE', 'VIDEO'], {
  errorMap: () => ({ message: 'mediaType must be IMAGE or VIDEO' }),
})

export const documentTypeSchema = z.enum(
  ['AADHAAR', 'PAN_CARD', 'DRIVING_LICENSE', 'PASSPORT', 'WORK_PERMIT', 'CERTIFICATE', 'OTHER'],
  { errorMap: () => ({ message: 'Invalid document type' }) }
)

// ── Worker profile ────────────────────────────────────────
export const updateWorkerProfileSchema = z.object({
  bio:             z.string().max(500, 'Bio max 500 characters').optional(),
  experienceYears: z.coerce.number().int().min(0).max(50).optional(),
  availability:    availabilitySchema.optional(),
})

// ── Search ────────────────────────────────────────────────
export const searchWorkersSchema = z.object({
  lat:        z.coerce.number().min(-90, 'Valid latitude required').max(90),
  lng:        z.coerce.number().min(-180, 'Valid longitude required').max(180),
  radiusKm:   z.coerce.number().min(1).max(100).optional(),
  categoryId: z.string().uuid('Invalid categoryId').optional(),
  city:       z.string().optional(),
})

// ── Categories ────────────────────────────────────────────
export const setCategoriesSchema = z.object({
  categoryIds: z
    .array(z.string().uuid('Each categoryId must be a valid UUID'))
    .min(1, 'At least one category is required'),
})

// ── Portfolio ─────────────────────────────────────────────
export const addPortfolioSchema = z.object({
  mediaUrl:  z.string().url('Valid media URL required'),
  mediaType: mediaTypeSchema,
  caption:   z.string().max(200, 'Caption max 200 characters').optional(),
})

// ── Documents ─────────────────────────────────────────────
export const uploadDocumentSchema = z.object({
  documentType: documentTypeSchema,
  documentUrl:  z.string().url('Valid document URL required'),
})

export const reviewDocumentSchema = z.object({
  status:          z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().min(1, 'Rejection reason is required').optional(),
})

// ── Params ────────────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid UUID required'),
})

// ── Internal event (discriminated union) ─────────────────
export const createWorkerEventSchema = z.object({
  eventType: z.literal('create_profile'),
  data: z.object({
    userId:          z.string().uuid(),
    bio:             z.string().optional(),
    experienceYears: z.coerce.number().int().min(0).optional(),
    availability:    availabilitySchema.optional(),
  }),
})

export const ratingUpdatedEventSchema = z.object({
  eventType: z.literal('rating_updated'),
  data: z.object({
    workerId:     z.string().uuid(),
    avgRating:    z.coerce.number().min(0).max(5),
    totalReviews: z.coerce.number().int().min(0),
  }),
})

export const mediaUploadedEventSchema = z.object({
  eventType: z.literal('media_uploaded'),
  data: z.object({
    workerId:  z.string().uuid(),
    mediaUrl:  z.string().url(),
    mediaType: mediaTypeSchema,
    caption:   z.string().max(200).optional(),
  }),
})

export const createWorkerAddress = z.object({
  city : z.string(),
  label :  z.string().optional(),
  line1 : z.string(),
  line2 : z.string().optional(), 
  pincode : z.string(),
  state : z.string()
})

export const internalWorkerEventSchema = z.discriminatedUnion('eventType', [
  createWorkerEventSchema,
  ratingUpdatedEventSchema,
  mediaUploadedEventSchema,
])

// ── Inferred types ────────────────────────────────────────
export type UpdateWorkerProfileInput  = z.infer<typeof updateWorkerProfileSchema>
export type SearchWorkersInput        = z.infer<typeof searchWorkersSchema>
export type SetCategoriesInput        = z.infer<typeof setCategoriesSchema>
export type AddPortfolioInput         = z.infer<typeof addPortfolioSchema>
export type UploadDocumentInput       = z.infer<typeof uploadDocumentSchema>
export type ReviewDocumentInput       = z.infer<typeof reviewDocumentSchema>
export type IdParamsInput             = z.infer<typeof idParamsSchema>
export type InternalWorkerEventInput  = z.infer<typeof internalWorkerEventSchema>
