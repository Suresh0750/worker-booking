import { z } from 'zod'
import { APP_ROLES } from '@/constants/utils'

// ─────────────────────────────────────────────
// Auth schemas
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required')
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().trim().min(8, 'Password must be at least 8 characters').regex(/[A-Z]/, 'Must contain at least one uppercase letter').regex(/[a-z]/, 'Must contain at least one lowercase letter').regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum([APP_ROLES.CUSTOMER, APP_ROLES.WORKER], { required_error: 'Please select a role' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ─────────────────────────────────────────────
// Slot schema
// ─────────────────────────────────────────────

export const slotSchema = z
  .object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    repeat: z.enum(['none', 'weekly']).default('none'),
  })
  .refine((d) => new Date(d.startTime) >= new Date(), {
    message: 'Start time must be in the future',
    path: ['startTime'],
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

// ─────────────────────────────────────────────
// Booking schema
// ─────────────────────────────────────────────

export const bookingSchema = z.object({
  slotId: z.string().optional(),
  jobDescription: z
    .string()
    .min(15, 'Please describe the job (at least 15 characters)')
    .max(500, 'Description must be under 500 characters')
    .optional(),
  location: z.object({
    lat: z.number({ required_error: 'Location is required' }),
    lng: z.number(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1),
  }),
  scheduledAt: z.string().min(1, 'Preferred date/time is required'),
})

// ─────────────────────────────────────────────
// Profile edit schema
// ─────────────────────────────────────────────

export const profileEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional(),
  profession: z.string().min(1, 'Profession is required'),
  rateType: z.enum(['HOURLY', 'DAILY']),
  rate: z.coerce.number().positive('Rate must be a positive number'),
  skills: z.string().min(1, 'Add at least one skill'),
  isAvailable: z.boolean(),
})

// ─────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type SlotFormData = z.infer<typeof slotSchema>
export type BookingFormData = z.infer<typeof bookingSchema>
export type ProfileEditFormData = z.infer<typeof profileEditSchema>
