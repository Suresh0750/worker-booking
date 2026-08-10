import { IUserRole } from '../../domain/entities/User'
import { z } from 'zod'

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
const PHONE_REGEX    = /^\+?[1-9]\d{7,14}$/

const roleSchema = z.enum([IUserRole.CUSTOMER, IUserRole.WORKER], {
  errorMap: () => ({ message: 'Role must be CUSTOMER or WORKER' }),
})


export const registerSchema = z
  .object({
    email: z.string().email('Valid email is required'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_REGEX,
        'Password must have uppercase, lowercase and a number'
      ),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),

    fullName: z
      .string()
      .min(2, 'Name must be 2-100 characters')
      .max(100, 'Name must be 2-100 characters'),

    phone: z
      .string()
      .min(8, 'Valid phone number required')
      .max(15, 'Valid phone number required')
      .regex(PHONE_REGEX, 'Valid phone number required'),

    role: roleSchema.optional(),
    isVerifyPhone : z.boolean(),
    isVerifyEmail : z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
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
    path: ['email'],
  })

export const verifyOtpSchema = z
  .object({
    email: z.string().email('Valid email is required').optional(),
    phone: z.string().regex(PHONE_REGEX, 'Valid phone number required').optional(),
    otp:   z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Provide an email or phone number',
    path: ['email'],
  })

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const logoutSchema = refreshTokenSchema

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// ── Params schemas ────────────────────────────────────────
export const idParamsSchema = z.object({
  id: z.string().uuid('Valid id is required'),
})

// ── Inferred request types ────────────────────────────────
export type RegisterRequestType     = z.infer<typeof registerSchema>
export type LoginRequestType        = z.infer<typeof loginSchema>
export type SendOtpRequestType      = z.infer<typeof sendOtpSchema>
export type VerifyOtpRequestType    = z.infer<typeof verifyOtpSchema>
export type RefreshTokenRequestType = z.infer<typeof refreshTokenSchema>
export type LogoutRequestType       = z.infer<typeof logoutSchema>
export type VerifyTokenRequestType  = z.infer<typeof verifyTokenSchema>
export type IdParamsType            = z.infer<typeof idParamsSchema>
