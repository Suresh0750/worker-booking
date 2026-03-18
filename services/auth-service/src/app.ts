import 'dotenv/config'
import express        from 'express'
import helmet         from 'helmet'
import cors           from 'cors'
import rateLimit      from 'express-rate-limit'
import authRoutes     from './presentation/routes/authRoutes'
import internalRoutes from './presentation/routes/internalRoutes'
import { errorHandler, notFoundHandler } from './presentation/middlewares/errorHandler'
import { logger } from './infrastructure/config/logger'

const app  = express()
const PORT = process.env.PORT ?? 3005

// ── Security middleware ──────────────────────────────────
app.use(helmet())         // Sets secure HTTP headers
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
}))

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))      // Limit body size — prevents payload attacks
app.use(express.urlencoded({ extended: true }))

// ── Rate limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX        ?? '100'),
  message:  { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// Stricter limiter for auth endpoints — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      20,              // Max 20 login/register attempts per 15 min per IP
  message:  { success: false, message: 'Too many auth attempts, please try again later.' },
})

app.use(limiter)

// ── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:  'ok',
    service: 'auth-service',
    uptime:  process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Routes ───────────────────────────────────────────────
app.use('/auth',     authLimiter, authRoutes)    // Public — client calls these
app.use('/internal', internalRoutes)             // Internal — other services only

// ── Error handling ───────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

export default app
