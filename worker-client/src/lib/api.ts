import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse, WorkerProfile, Booking, TimeSlot, DashboardStats, JobRequest, AuthUser } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ─────────────────────────────────────────────
// OTP helpers
// ─────────────────────────────────────────────

/** Normalise a 10-digit Indian mobile number to E.164 (+91XXXXXXXXXX). */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('+')) return phone.trim()
  return `+${digits}`
}

export interface SendOtpBody   { email?: string; phone?: string }
export interface VerifyOtpBody { email?: string; phone?: string; otp: string }
// ─────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────

export const tokenStore = {
  get: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  },
  /** Sync helper — stores the access token in localStorage. */
  setAccess: (access: string) => {
    localStorage.setItem('access_token', access)
  },
  /**
   * Stores the access token in localStorage.
   * The refresh token is set as an httpOnly cookie directly by the backend
   * and is never accessible from client-side JavaScript.
   */
  set: (access: string) => {
    localStorage.setItem('access_token', access)
  },
  clear: async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    await fetch('/api/auth/clear-tokens', { method: 'POST' })
  },
  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null }
  },
  setUser: (user: AuthUser) => localStorage.setItem('user', JSON.stringify(user)),
}

// ─────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// Attach access token to every request
http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as any
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // Hit the Next.js proxy — it reads the httpOnly cookie server-side
        const { data } = await axios.post('/api/auth/refresh')
        const newAccessToken = data.data.accessToken
        tokenStore.setAccess(newAccessToken)
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return http(original)
      } catch {
        await tokenStore.clear()
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
    }
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────
// API methods
// ─────────────────────────────────────────────

export const api = {
  // Auth
  auth: {
    register: (body: unknown) =>
      http.post<ApiResponse<{ user: AuthUser }>>('/auth/register', body).then((r) => r.data),
    login: (body: unknown) =>
      http.post<ApiResponse<{user : AuthUser,accessToken:string}>>('/auth/login', body).then((r) => r.data),
    sendOtp: (body: SendOtpBody) => {
      const payload: SendOtpBody = body.phone
        ? { phone: toE164(body.phone) }
        : { email: body.email }
      return http.post<ApiResponse<{ sent: boolean; expiresIn?: number; debugCode?: string }>>('/auth/send-otp', payload).then((r) => r.data)
    },
    verifyOtp: (body: VerifyOtpBody) => {
      const payload: VerifyOtpBody = body.phone
        ? { phone: toE164(body.phone), otp: body.otp }
        : { email: body.email, otp: body.otp }
      return http.post<ApiResponse<{ verified: boolean }>>('/auth/verify-otp', payload).then((r) => r.data)
    },
    /** Send an OTP to an already-registered email/phone (post-login verification) */
    sendLoginOtp: (body: SendOtpBody) => {
      const payload: SendOtpBody = body.phone
        ? { phone: toE164(body.phone) }
        : { email: body.email }
      return http.post<ApiResponse<{ sent: boolean; expiresIn?: number; debugCode?: string }>>('/auth/send-login-otp', payload).then((r) => r.data)
    },
    /** Verify the LOGIN-purpose OTP returned by sendLoginOtp */
    verifyLoginOtp: (body: VerifyOtpBody) => {
      const payload: VerifyOtpBody = body.phone
        ? { phone: toE164(body.phone), otp: body.otp }
        : { email: body.email, otp: body.otp }
      return http.post<ApiResponse<{ verified: boolean }>>('/auth/verify-login-otp', payload).then((r) => r.data)
    },
    logout: async () => {
      await tokenStore.clear()  // clears access token + httpOnly cookie
      return http.post('/auth/logout').then((r) => r.data)
    },
    refresh: () =>
      http.post('/auth/refresh').then((r) => r.data),
  },

  // Worker discovery (client-facing)
  workers: {
    search: (params: Record<string, unknown>) =>
      http.get<ApiResponse<WorkerProfile[]>>('/workers/search', { params }).then((r) => r.data),
    getById: (id: string) =>
      http.get<ApiResponse<WorkerProfile>>(`/workers/${id}`).then((r) => r.data),
    getSlots: (workerId: string) =>
      http.get<ApiResponse<TimeSlot[]>>(`/workers/${workerId}/slots`).then((r) => r.data),
  },

  // Bookings (client-facing)
  bookings: {
    create: (body: unknown) =>
      http.post<ApiResponse<Booking>>('/bookings', body).then((r) => r.data),
    getClientBookings: () =>
      http.get<ApiResponse<Booking[]>>('/client/bookings').then((r) => r.data),
    cancel: (id: string) =>
      http.post(`/client/bookings/${id}/cancel`).then((r) => r.data),
  },

  // Worker-side
  worker: {
    getProfile: () =>
      http.get<ApiResponse<WorkerProfile>>('/worker/profile').then((r) => r.data),
    updateProfile: (body: unknown) =>
      http.put<ApiResponse<WorkerProfile>>('/worker/profile', body).then((r) => r.data),
    getDashboard: () =>
      http.get<ApiResponse<DashboardStats>>('/worker/dashboard').then((r) => r.data),
    getBookings: (status?: string) =>
      http.get<ApiResponse<Booking[]>>('/worker/bookings', { params: { status } }).then((r) => r.data),
    confirmBooking: (id: string) =>
      http.post(`/worker/bookings/${id}/confirm`).then((r) => r.data),
    cancelBooking: (id: string) =>
      http.post(`/worker/bookings/${id}/cancel`).then((r) => r.data),
    getSlots: () =>
      http.get<ApiResponse<TimeSlot[]>>('/worker/slots').then((r) => r.data),
    createSlot: (body: unknown) =>
      http.post<ApiResponse<TimeSlot>>('/worker/slots', body).then((r) => r.data),
    deleteSlot: (id: string) =>
      http.delete(`/worker/slots/${id}`).then((r) => r.data),
    getJobRequests: () =>
      http.get<ApiResponse<JobRequest[]>>('/worker/job-requests').then((r) => r.data),
    acceptJob: (id: string) =>
      http.post(`/worker/job-requests/${id}/accept`).then((r) => r.data),
    declineJob: (id: string) =>
      http.post(`/worker/job-requests/${id}/decline`).then((r) => r.data),
    uploadPhoto: async (file: File) => {
      const form = new FormData()
      form.append('photo', file)
      return http.post<ApiResponse<{ url: string }>>('/worker/photos', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    deletePhoto: (url: string) =>
      http.delete('/worker/photos', { data: { url } }).then((r) => r.data),
  },
}
