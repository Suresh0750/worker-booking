import 'dotenv/config'
import express    from 'express'
import helmet     from 'helmet'
import cors       from 'cors'
import rateLimit  from 'express-rate-limit'
import routes     from './presentation/routes/index'
import { requestLogger, errorHandler, notFoundHandler } from './presentation/middlewares/requestLogger'
import { logger } from './infrastructure/config/logger'

const app  = express()
const PORT = process.env.PORT ?? 3000

// ── Security ──────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  }),
)

// ── Body parsing ──────────────────────────────────────────
// Note: multipart/form-data (file uploads) is handled by multer in media-service
// Gateway just forwards the raw body — don't parse it or multer breaks
app.use((req, _res, next) => {
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    next() // skip body parsing for file uploads — proxy forwards raw stream
  } else {
    express.json({ limit: '10kb' })(req, _res, next)
  }
})
app.use(express.urlencoded({ extended: true }))

// ── Global rate limit ─────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max:             parseInt(process.env.RATE_LIMIT_MAX        ?? '200'),
  message:         { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => req.path === '/health', // skip health check from rate limiting
})
app.use(globalLimiter)

// ── Request logging ───────────────────────────────────────
app.use(requestLogger)

// ── Gateway health check ──────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'api-gateway',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── All API routes under /api prefix ─────────────────────
app.use('/api', routes)

// ── Block direct access to /internal routes ───────────────
// Extra safety — services should not expose /internal to gateway's public port
app.use('/internal', (_req, res) => {
  res.status(403).json({ success: false, message: 'Forbidden' })
})

// ── Error handling ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT} in ${process.env.NODE_ENV} mode`)
  logger.info('Routes:')
  logger.info('  /api/auth/*      → auth-service:3001')
  logger.info('  /api/users/*     → user-service:3002')
  logger.info('  /api/workers/*   → worker-service:3003')
  logger.info('  /api/bookings/*  → booking-service:3004')
  logger.info('  /api/reviews/*   → review-service:3005')
  logger.info('  /api/media/*     → media-service:3006')
})

export default app
