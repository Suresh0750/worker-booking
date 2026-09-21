import { z } from 'zod'
import { UserRole } from '@domain/entities/User'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
const PHONE_REGEX    = /^\+?[1-9]\d{7,14}$/

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Name must be 2-100 characters')
      .max(100, 'Name must be 2-100 characters'),
    email: z.string().email('Valid email is required'),
    phone: z
      .string()
      .min(8, 'Valid phone number required')
      .max(15, 'Valid phone number required')
      .regex(PHONE_REGEX, 'Valid phone number required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(PASSWORD_REGEX, 'Password must contain uppercase, lowercase and a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z
      .enum([UserRole.CUSTOMER, UserRole.WORKER], {
        errorMap: () => ({ message: 'Role must be CUSTOMER or WORKER' }),
      })
      .optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  })

export const loginSchema = z.object({
  email:    z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const sendOtpSchema = z
  .object({
    email: z.string().email('Valid email is required').optional(),
    phone: z.string().regex(PHONE_REGEX, 'Valid phone number required').optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Provide an email or phone number',
    path:    ['email'],
  })

export const verifyOtpSchema = z
  .object({
    email: z.string().email('Valid email is required').optional(),
    phone: z.string().regex(PHONE_REGEX, 'Valid phone number required').optional(),
    otp:   z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Provide an email or phone number',
    path:    ['email'],
  })

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const logoutSchema = refreshTokenSchema

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// ── Inferred types ────────────────────────────────────────
export type RegisterInput     = z.infer<typeof registerSchema>
export type LoginInput        = z.infer<typeof loginSchema>
export type SendOtpInput      = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput    = z.infer<typeof verifyOtpSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type LogoutInput       = z.infer<typeof logoutSchema>
export type VerifyTokenInput  = z.infer<typeof verifyTokenSchema>
