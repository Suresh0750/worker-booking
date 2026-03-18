import 'dotenv/config'
import express        from 'express'
import helmet         from 'helmet'
import cors           from 'cors'
import rateLimit      from 'express-rate-limit'
import bookingRoutes  from './presentation/routes/bookingRoutes'
import internalRoutes from './presentation/routes/internalRoutes'
import { errorHandler, notFoundHandler } from './presentation/middlewares/index'
import { logger } from './infrastructure/config/logger'

const app  = express()
const PORT = process.env.PORT ?? 3004

// ── Security ──────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  }),
)

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rate limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max:             parseInt(process.env.RATE_LIMIT_MAX        ?? '100'),
  message:         { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})
app.use(limiter)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'booking-service',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Routes ────────────────────────────────────────────────
app.use('/bookings', bookingRoutes)   // Public (needs auth headers from gateway)
app.use('/internal', internalRoutes)  // Internal service-to-service only

// ── Error handling ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Booking service running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

export default app
