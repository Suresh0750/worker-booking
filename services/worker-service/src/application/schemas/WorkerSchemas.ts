import { z } from 'zod'

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/
const PINCODE_REGEX = /^\d{6}$/

const availabilitySchema = z.enum(['AVAILABLE', 'BUSY', 'UNAVAILABLE'], {
  errorMap: () => ({ message: 'Invalid availability' }),
})

const mediaTypeSchema = z.enum(['IMAGE', 'VIDEO'], {
  errorMap: () => ({ message: 'mediaType must be IMAGE or VIDEO' }),
})

// ── Profile schemas ───────────────────────────────────────
export const updateProfileSchema = z.object({
  name:             z.string().min(2, 'Name must be 2-100 characters').max(100, 'Name must be 2-100 characters').optional(),
  phone:            z.string().min(8, 'Valid phone number required').max(15, 'Valid phone number required').regex(PHONE_REGEX, 'Valid phone number required').optional(),
  avatar:           z.string().url('Avatar must be a valid URL').optional(),
  bio:              z.string().max(500, 'Bio max 500 characters').optional(),
  experienceYears:  z.coerce.number().int().min(0, 'Experience must be 0-50 years').max(50, 'Experience must be 0-50 years').optional(),
  availability:     availabilitySchema.optional(),
})

// ── Search query schema ───────────────────────────────────
export const searchWorkersSchema = z.object({
  lat:        z.coerce.number().min(-90, 'Valid latitude required').max(90, 'Valid latitude required'),
  lng:        z.coerce.number().min(-180, 'Valid longitude required').max(180, 'Valid longitude required'),
  radiusKm:   z.coerce.number().min(1, 'Radius must be 1-100 km').max(100, 'Radius must be 1-100 km').optional(),
  categoryId: z.string().uuid('Invalid categoryId').optional(),
  city:       z.string().optional(),
})

// ── Address schema ────────────────────────────────────────
export const addAddressSchema = z.object({
  line1:    z.string().min(1, 'Address line1 is required'),
  line2:    z.string().optional(),
  city:     z.string().min(1, 'City is required'),
  state:    z.string().min(1, 'State is required'),
  pincode:  z.string().regex(PINCODE_REGEX, 'Valid 6-digit pincode required'),
  lat:      z.coerce.number().min(-90, 'Valid latitude required').max(90, 'Valid latitude required'),
  lng:      z.coerce.number().min(-180, 'Valid longitude required').max(180, 'Valid longitude required'),
  isPrimary: z.boolean().optional(),
})

// ── Portfolio schema ──────────────────────────────────────
export const addPortfolioSchema = z.object({
  mediaUrl:  z.string().url('Valid media URL required'),
  mediaType: mediaTypeSchema,
  caption:   z.string().max(200, 'Caption max 200 characters').optional(),
})

// ── Categories schema ─────────────────────────────────────
export const setCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid('Each categoryId must be a valid UUID')).min(1, 'At least one category required'),
})

// ── Params schemas ────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid id is required'),
})

// ── Internal event schema (discriminated union) ──────────
export const createWorkerProfileDataSchema = z.object({
  userId:          z.string().min(1, 'userId is required'),
  email:           z.string().email('Valid email is required'),
  name:            z.string().optional(),
  phone:           z.string().optional(),
  avatar:          z.string().url('Avatar must be a valid URL').optional(),
  bio:             z.string().max(500, 'Bio max 500 characters').optional(),
  experienceYears: z.coerce.number().int().min(0, 'Experience must be 0-50 years').max(50, 'Experience must be 0-50 years').optional(),
  availability:    availabilitySchema.optional(),
})

export const createWorkerEventSchema = z.object({
  eventType: z.literal('create_profile'),
  data:      createWorkerProfileDataSchema,
})

export const ratingUpdatedEventSchema = z.object({
  eventType: z.literal('rating_updated'),
  data: z.object({
    workerId:     z.string().min(1, 'workerId is required'),
    avgRating:    z.coerce.number().min(0, 'Invalid average rating').max(5, 'Invalid average rating'),
    totalReviews: z.coerce.number().int().min(0, 'Invalid review count'),
  }),
})

export const mediaUploadedEventSchema = z.object({
  eventType: z.literal('media_uploaded'),
  data: z.object({
    workerId:  z.string().min(1, 'workerId is required'),
    mediaUrl:  z.string().url('Valid media URL required'),
    mediaType: mediaTypeSchema,
    caption:   z.string().max(200, 'Caption max 200 characters').optional(),
  }),
})

export const internalEventSchema = z.discriminatedUnion('eventType', [
  createWorkerEventSchema,
  ratingUpdatedEventSchema,
  mediaUploadedEventSchema,
])

// ── Inferred request types ────────────────────────────────
export type UpdateWorkerProfileRequestType = z.infer<typeof updateProfileSchema>
export type SearchWorkersRequestType       = z.infer<typeof searchWorkersSchema>
export type AddWorkerAddressRequestType    = z.infer<typeof addAddressSchema>
export type AddPortfolioRequestType        = z.infer<typeof addPortfolioSchema>
export type SetCategoriesRequestType       = z.infer<typeof setCategoriesSchema>
export type CreateWorkerProfileRequestType = z.infer<typeof createWorkerProfileDataSchema>
export type IdParamsType                   = z.infer<typeof idParamsSchema>
export type InternalEventType              = z.infer<typeof internalEventSchema>
