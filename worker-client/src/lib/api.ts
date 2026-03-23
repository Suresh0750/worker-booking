import axios, { AxiosInstance, AxiosError } from 'axios'
import { ApiResponse, WorkerProfile, Booking, TimeSlot, DashboardStats, JobRequest, AuthUser } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

const AUTH_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3005'
// ─────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────

export const tokenStore = {
  get: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  },
  getRefresh: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  },
  set: (access: string, refresh: string) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
  },
  clear: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
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
  baseURL: AUTH_URL,
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
      const refreshToken = tokenStore.getRefresh()
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
          tokenStore.set(data.data.accessToken, data.data.refreshToken)
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return http(original)
        } catch {
          tokenStore.clear()
          if (typeof window !== 'undefined') window.location.href = '/auth/login'
        }
      } else {
        tokenStore.clear()
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
      http.post<ApiResponse<AuthUser>>('/auth/login', body).then((r) => r.data),
    logout: () => {
      const refreshToken = tokenStore.getRefresh()
      tokenStore.clear()
      return http.post('/auth/logout', { refreshToken }).then((r) => r.data)
    },
    refresh: (refreshToken: string) =>
      http.post('/auth/refresh', { refreshToken }).then((r) => r.data),
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
