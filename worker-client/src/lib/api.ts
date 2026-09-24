import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse, WorkerProfile, Booking, TimeSlot, DashboardStats, JobRequest, AuthUser, WorkerAddress, WorkerService, WorkerCategory, PortfolioItem, WorkerDocument, WorkerFullProfile, Message, Conversation } from '@/types'

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
  /** Sync helper — stores the access token in localStorage AND a JS-readable cookie for middleware */
  setAccess: (access: string) => {
    localStorage.setItem('access_token', access)
    // Write a non-httpOnly cookie so Next.js middleware can check auth status on the edge.
    // It does NOT replace the httpOnly refresh token — it's just a presence signal.
    document.cookie = `access_token=${access}; path=/; SameSite=Strict; max-age=${15 * 60}`
  },
  /**
   * Stores the access token in localStorage.
   * The refresh token is set as an httpOnly cookie directly by the backend
   * and is never accessible from client-side JavaScript.
   */
  set: (access: string) => {
    localStorage.setItem('access_token', access)
    document.cookie = `access_token=${access}; path=/; SameSite=Strict; max-age=${15 * 60}`
  },
  /** Write a role cookie so middleware can redirect to the right dashboard */
  setRole: (role: string) => {
    document.cookie = `user_role=${role}; path=/; SameSite=Strict; max-age=${30 * 24 * 60 * 60}`
  },
  clear: async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    // Clear the middleware-readable cookies too
    document.cookie = 'access_token=; path=/; max-age=0'
    document.cookie = 'user_role=; path=/; max-age=0'
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

  // Public location lookup used by dependent address fields
  locations: {
    search: (params: { searchKey: 'state' | 'city' | 'pincode'; search?: string; state?: string; city?: string }) =>
      http.get<ApiResponse<string[]>>('/locations', { params }).then((r) => r.data),
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

    // Full profile (User + Worker merged) — GET /workers/me
    getFullProfile: () =>
      http.get<ApiResponse<WorkerFullProfile>>('/workers/me').then((r) => r.data),

    // Update worker-specific fields (bio, experienceYears, availability) — PATCH /workers/me
    updateWorkerFields: (body: { bio?: string; experienceYears?: number; availability?: string }) => {
      const clean = Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined && v !== '')
      )
      return http.patch<ApiResponse<WorkerFullProfile>>('/workers/me', clean).then((r) => r.data)
    },

    // Update user-level fields (fullName, phone, gender, dob, etc.) — PATCH /users/me
    updateUserFields: (body: {
      fullName?: string; phone?: string; secondaryPhone?: string;
      gender?: string; dob?: string; profileImage?: string
    }) => {
      // Strip undefined and empty-string values so the backend schema doesn't fail validation
      const clean = Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined && v !== '')
      )
      return http.patch<ApiResponse<{ id: string }>>('/users/me', clean).then((r) => r.data)
    },

    // Kept for backwards-compat — calls both endpoints
    updateFullProfile: async (body: {
      fullName?: string; phone?: string; secondaryPhone?: string;
      gender?: string; dob?: string;
      bio?: string; experienceYears?: number;
    }) => {
      const { bio, experienceYears, ...userFields } = body
      await http.patch('/users/me', userFields)
      const res = await http.patch<ApiResponse<WorkerFullProfile>>('/workers/me', { bio, experienceYears })
      return res.data
    },

    uploadProfileImage: async (file: File) => {
      const form = new FormData()
      form.append('image', file)
      // Upload to user profile image endpoint
      return http.patch<ApiResponse<{ profileImage: string }>>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },

    // Addresses
    getAddresses: () =>
      http.get<ApiResponse<WorkerAddress[]>>('/workers/addresses').then((r) => r.data),
    createAddress: (body: unknown) =>
      http.post<ApiResponse<WorkerAddress>>('/workers/addresses', body).then((r) => r.data),
    updateAddress: (id: string, body: unknown) =>
      http.put<ApiResponse<WorkerAddress>>(`/workers/addresses/${id}`, body).then((r) => r.data),
    deleteAddress: (id: string) =>
      http.delete(`/workers/addresses/${id}`).then((r) => r.data),
    setPrimaryAddress: (id: string) =>
      http.post(`/workers/addresses/${id}/primary`).then((r) => r.data),

    // Services
    getServices: () =>
      http.get<ApiResponse<WorkerService[]>>('/workers/services').then((r) => r.data),
    addService: (body: { serviceId: string; price?: number }) =>
      http.post<ApiResponse<WorkerService>>('/workers/services', body).then((r) => r.data),
    updateService: (id: string, body: { price?: number; isActive: boolean }) =>
      http.put<ApiResponse<WorkerService>>(`/workers/services/${id}`, body).then((r) => r.data),
    removeService: (id: string) =>
      http.delete(`/workers/services/${id}`).then((r) => r.data),

    // Categories
    getCategories: () =>
      http.get<ApiResponse<WorkerCategory[]>>('/workers/categories').then((r) => r.data),
    addCategory: (categoryId: string) =>
      http.post<ApiResponse<WorkerCategory>>('/workers/categories', { categoryId }).then((r) => r.data),
    removeCategory: (categoryId: string) =>
      http.delete(`/workers/categories/${categoryId}`).then((r) => r.data),

    // Portfolio (media)
    getPortfolio: () =>
      http.get<ApiResponse<PortfolioItem[]>>('/workers/portfolio').then((r) => r.data),
    uploadPortfolioMedia: async (file: File, caption?: string) => {
      const form = new FormData()
      form.append('media', file)
      if (caption) form.append('caption', caption)
      return http.post<ApiResponse<PortfolioItem>>('/workers/portfolio', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    updatePortfolioCaption: (id: string, caption: string) =>
      http.put<ApiResponse<PortfolioItem>>(`/workers/portfolio/${id}`, { caption }).then((r) => r.data),
    deletePortfolioItem: (id: string) =>
      http.delete(`/workers/portfolio/${id}`).then((r) => r.data),

    // Documents
    getDocuments: () =>
      http.get<ApiResponse<WorkerDocument[]>>('/workers/documents').then((r) => r.data),
    uploadDocument: async (file: File, documentType: string) => {
      const form = new FormData()
      form.append('document', file)
      form.append('documentType', documentType)
      return http.post<ApiResponse<WorkerDocument>>('/workers/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data)
    },
    deleteDocument: (id: string) =>
      http.delete(`/workers/documents/${id}`).then((r) => r.data),

    // Availability
    updateAvailability: (availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE') =>
      http.put<ApiResponse<{ availability: string }>>('/workers/availability', { availability }).then((r) => r.data),

    // Account / Security
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      http.put('/workers/password', body).then((r) => r.data),
    getSessions: () =>
      http.get<ApiResponse<{ id: string; ipAddress?: string; userAgent?: string; createdAt: string }[]>>('/workers/sessions').then((r) => r.data),
    revokeSession: (id: string) =>
      http.delete(`/workers/sessions/${id}`).then((r) => r.data),
    revokeAllSessions: () =>
      http.delete('/workers/sessions').then((r) => r.data),

    // Messages
    getConversations: () =>
      http.get<ApiResponse<Conversation[]>>('/workers/conversations').then((r) => r.data),
    getMessages: (conversationId: string) =>
      http.get<ApiResponse<Message[]>>(`/workers/conversations/${conversationId}/messages`).then((r) => r.data),
    sendMessage: (conversationId: string, content: string) =>
      http.post<ApiResponse<Message>>(`/workers/conversations/${conversationId}/messages`, { content }).then((r) => r.data),
  },

  // Shared catalogue (used by worker services/categories pages)
  catalogue: {
    getCategories: () =>
      http.get<ApiResponse<{ id: string; name: string; slug: string; icon?: string }[]>>('/categories').then((r) => r.data),
    getServices: (categoryId?: string) =>
      http.get<ApiResponse<{ id: string; categoryId: string; name: string; slug: string }[]>>('/services', { params: { categoryId } }).then((r) => r.data),
  },
}
