import { z } from 'zod'

const PHONE_REGEX   = /^\+?[1-9]\d{7,14}$/
const PINCODE_REGEX = /^\d{6}$/

export const updateProfileSchema = z.object({
  fullName:       z.string().min(2, 'Name must be 2-100 characters').max(100).optional(),
  phone:          z.string().regex(PHONE_REGEX, 'Valid phone number required').optional(),
  secondaryPhone: z.string().regex(PHONE_REGEX, 'Valid phone number required').optional(),
  gender:         z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dob:            z.coerce.date().optional(),
  profileImage:   z.string().url('Profile image must be a valid URL').optional(),
})

export const createAddressSchema = z.object({
  line1:     z.string().min(1, 'Address line 1 is required'),
  line2:     z.string().optional(),
  city:      z.string().min(1, 'City is required'),
  state:     z.string().min(1, 'State is required'),
  pincode:   z.string().regex(PINCODE_REGEX, 'Valid 6-digit pincode required'),
  lat:       z.coerce.number().min(-90).max(90).optional(),
  lng:       z.coerce.number().min(-180).max(180).optional(),
  label:     z.string().optional(),
  isPrimary: z.boolean().optional(),
})

export const updateAddressSchema = z.object({
  line1:   z.string().min(1, 'Address line 1 cannot be empty').optional(),
  line2:   z.string().optional(),
  city:    z.string().min(1, 'City cannot be empty').optional(),
  state:   z.string().min(1, 'State cannot be empty').optional(),
  pincode: z.string().regex(PINCODE_REGEX, 'Valid 6-digit pincode required').optional(),
  lat:     z.coerce.number().min(-90).max(90).optional(),
  lng:     z.coerce.number().min(-180).max(180).optional(),
  label:   z.string().optional(),
})

export const idParamsSchema = z.object({
  id: z.string().uuid('Valid UUID required'),
})

// ── Inferred types ────────────────────────────────────────
export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>
export type CreateAddressInput  = z.infer<typeof createAddressSchema>
export type UpdateAddressInput  = z.infer<typeof updateAddressSchema>
export type IdParamsInput       = z.infer<typeof idParamsSchema>
