import { Router, Request, Response }   from 'express'
import rateLimit                        from 'express-rate-limit'
import { authenticate, optionalAuthenticate, requireRole } from '../middlewares/auth'
import { createProxy }                  from '../middlewares/proxy'
import { SERVICES }                     from '../../infrastructure/config/services'

const router = Router()

// ── Rate limiters ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '20'),
  message:  { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
})

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      50,
  message:  { success: false, message: 'Upload limit reached. Try again in an hour.' },
})

// ── Auth Service routes — public, no JWT needed ───────────
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/refresh
// POST /api/auth/logout
router.use(
  '/auth',
  authLimiter,
  createProxy(SERVICES.AUTH, { '^/api/auth': '/auth' }),
)

// ── User Service routes ───────────────────────────────────
// GET  /api/users/me           → own profile
// PATCH /api/users/me          → update profile
// POST /api/users/me/addresses → add address
// etc.
router.use(
  '/users',
  authenticate,
  createProxy(SERVICES.USER, { '^/api/users': '/users' }),
)

// ── Worker Service routes ─────────────────────────────────
// GET  /api/workers/search     → public geo search (optional auth)
// GET  /api/workers/categories → public category list
// GET  /api/workers/:id        → public worker profile
// PATCH /api/workers/me        → update own worker profile (auth + WORKER role)
// etc.
router.use(
  '/workers/search',
  optionalAuthenticate,
  createProxy(SERVICES.WORKER, { '^/api/workers': '/workers' }),
)

router.use(
  '/workers/categories',
  createProxy(SERVICES.WORKER, { '^/api/workers': '/workers' }),
)

// Worker profile management — must be WORKER role
router.use(
  '/workers/me',
  authenticate,
  requireRole('WORKER'),
  createProxy(SERVICES.WORKER, { '^/api/workers': '/workers' }),
)

// View any worker public profile — public
router.use(
  '/workers/:id',
  optionalAuthenticate,
  createProxy(SERVICES.WORKER, { '^/api/workers': '/workers' }),
)

// Catch-all for remaining worker routes
router.use(
  '/workers',
  authenticate,
  createProxy(SERVICES.WORKER, { '^/api/workers': '/workers' }),
)

// ── Booking Service routes ────────────────────────────────
// POST /api/bookings           → create hire request
// GET  /api/bookings/my        → my bookings
// GET  /api/bookings/:id       → single booking
// PATCH /api/bookings/:id/status → update status
// POST /api/bookings/:id/messages → send message
// etc.
router.use(
  '/bookings',
  authenticate,
  createProxy(SERVICES.BOOKING, { '^/api/bookings': '/bookings' }),
)

// ── Review Service routes ─────────────────────────────────
// POST /api/reviews            → submit review (auth)
// GET  /api/reviews/my         → my reviews (auth)
// GET  /api/reviews/worker/:id → worker reviews (public)
// GET  /api/reviews/worker/:id/stats → rating stats (public)
router.use(
  '/reviews/worker',
  optionalAuthenticate,
  createProxy(SERVICES.REVIEW, { '^/api/reviews': '/reviews' }),
)

router.use(
  '/reviews',
  authenticate,
  createProxy(SERVICES.REVIEW, { '^/api/reviews': '/reviews' }),
)

// ── Media Service routes ──────────────────────────────────
// POST /api/media/upload       → upload portfolio file
// GET  /api/media/my           → my uploaded files
// DELETE /api/media/:id        → delete file
router.use(
  '/media',
  authenticate,
  requireRole('WORKER'),
  uploadLimiter,
  createProxy(SERVICES.MEDIA, { '^/api/media': '/media' }),
)

// ── Health check for all downstream services ──────────────
router.get('/health/all', async (_req: Request, res: Response) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const controller = new AbortController()
        const timeout    = setTimeout(() => controller.abort(), 3000)
        const response   = await fetch(`${url}/health`, { signal: controller.signal })
        clearTimeout(timeout)
        return { name, status: response.ok ? 'up' : 'down', url }
      } catch {
        return { name, status: 'down', url }
      }
    }),
  )

  const results = checks.map((c) => (c.status === 'fulfilled' ? c.value : c.reason))
  const allUp   = results.every((r) => r.status === 'up')

  res.status(allUp ? 200 : 207).json({
    success:  allUp,
    services: results,
  })
})

export default router
