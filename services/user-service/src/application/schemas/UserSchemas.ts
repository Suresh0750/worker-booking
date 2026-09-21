import { z } from 'zod'

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/
const PINCODE_REGEX = /^\d{6}$/

const roleSchema = z.enum(['USER', 'WORKER', 'ADMIN'], {
  errorMap: () => ({ message: 'Invalid role' }),
})

// ── Profile schemas ───────────────────────────────────────
export const updateProfileSchema = z.object({
  name:   z.string().min(2, 'Name must be 2-100 characters').max(100, 'Name must be 2-100 characters').optional(),
  phone:  z.string().min(8, 'Valid phone number required').max(15, 'Valid phone number required').regex(PHONE_REGEX, 'Valid phone number required').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
})

// ── Address schemas ───────────────────────────────────────
export const createAddressSchema = z.object({
  line1:    z.string().min(1, 'Address line1 is required'),
  line2:    z.string().optional(),
  city:     z.string().min(1, 'City is required'),
  state:    z.string().min(1, 'State is required'),
  pincode:  z.string().regex(PINCODE_REGEX, 'Valid 6-digit pincode required'),
  lat:      z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  lng:      z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  isPrimary: z.boolean().optional(),
})

export const updateAddressSchema = z.object({
  line1:    z.string().min(1, 'Address line1 cannot be empty').optional(),
  line2:    z.string().optional(),
  city:     z.string().min(1, 'City cannot be empty').optional(),
  state:    z.string().min(1, 'State cannot be empty').optional(),
  pincode:  z.string().regex(PINCODE_REGEX, 'Valid 6-digit pincode required').optional(),
  lat:      z.coerce.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude').optional(),
  lng:      z.coerce.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude').optional(),
  isPrimary: z.boolean().optional(),
})

// ── Params schemas ────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid id is required'),
})

// ── Internal event schemas ────────────────────────────────
export const createProfileEventSchema = z.object({
  eventType: z.literal('create_profile'),
  data: z.object({
    userId: z.string().uuid('Valid userId is required'),
    email:  z.string().email('Valid email is required'),
    role:   roleSchema,
  }),
})

// ── Inferred request types ────────────────────────────────
export type UpdateProfileRequestType = z.infer<typeof updateProfileSchema>
export type CreateAddressRequestType = z.infer<typeof createAddressSchema>
export type UpdateAddressRequestType = z.infer<typeof updateAddressSchema>
export type IdParamsType             = z.infer<typeof idParamsSchema>
export type CreateProfileEventType   = z.infer<typeof createProfileEventSchema>
