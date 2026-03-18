import 'dotenv/config'
import express      from 'express'
import helmet       from 'helmet'
import cors         from 'cors'
import rateLimit    from 'express-rate-limit'
import mediaRoutes  from './presentation/routes/mediaRoutes'
import { errorHandler, notFoundHandler } from './presentation/middlewares/index'
import { logger } from './infrastructure/config/logger'

const app  = express()
const PORT = process.env.PORT ?? 3006

// ── Security ──────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  }),
)

// ── Body parsing ──────────────────────────────────────────
// Note: do NOT set a JSON body limit here — multer handles multipart
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// ── Rate limiting ─────────────────────────────────────────
// Stricter for upload endpoint — prevents abuse
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      50,              // Max 50 uploads per hour per IP
  message:  { success: false, message: 'Upload limit reached. Try again in an hour.' },
})

const generalLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  max:             parseInt(process.env.RATE_LIMIT_MAX        ?? '100'),
  message:         { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

app.use(generalLimiter)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    service:   'media-service',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Routes ────────────────────────────────────────────────
app.use('/media', uploadLimiter, mediaRoutes)

// ── Error handling ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Media service running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

export default app
