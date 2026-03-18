// Single source of truth for all downstream service URLs
// In production these come from environment variables (Docker/K8s service names)
export const SERVICES = {
  AUTH:         process.env.AUTH_SERVICE_URL         ?? 'http://localhost:3001',
  USER:         process.env.USER_SERVICE_URL         ?? 'http://localhost:3002',
  WORKER:       process.env.WORKER_SERVICE_URL       ?? 'http://localhost:3003',
  BOOKING:      process.env.BOOKING_SERVICE_URL      ?? 'http://localhost:3004',
  REVIEW:       process.env.REVIEW_SERVICE_URL       ?? 'http://localhost:3005',
  MEDIA:        process.env.MEDIA_SERVICE_URL        ?? 'http://localhost:3006',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3007',
} as const
