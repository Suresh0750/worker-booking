import 'dotenv/config'
import express        from 'express'
import helmet         from 'helmet'
import cors           from 'cors'
import rateLimit      from 'express-rate-limit'
import cookieParser   from 'cookie-parser'
import path           from 'path'

import authRoutes     from './presentation/routes/authRoutes'
import userRoutes     from './presentation/routes/userRoutes'
import workerRoutes   from './presentation/routes/workerRoutes'
import internalRoutes from './presentation/routes/internalRoutes'
import seedRoutes     from './presentation/routes/seedRoutes'
import locationRoutes from './presentation/routes/locationRoutes'
import { errorHandler, notFoundHandler } from './presentation/middlewares/errorHandler'
import { logger } from './infrastructure/config/logger'
import { HttpStatus } from './domain/enums/HttpStatus'
import { authenticateJwt } from '@presentation/middlewares/authenticateJwt'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Security ──────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
}))

// ── Static files (uploads) ────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ── Global rate limiter ───────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'), // 15 min
  max:             parseInt(process.env.RATE_LIMIT_MAX        ?? '100'),
  message:         { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})
app.use(globalLimiter)

// ── Stricter limiter for auth endpoints (brute-force protection) ──
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 min
  max:             20,
  message:         { success: false, message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(HttpStatus.OK).json({
    status:    'ok',
    service:   'core-service',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Routes ────────────────────────────────────────────────
app.use('/auth',     authLimiter, authRoutes)   // auth — stricter rate limit
app.use('/users',    userRoutes)                // user profiles + addresses
app.use('/workers', workerRoutes)              // worker profiles + search
app.use('/internal', internalRoutes)            // service-to-service only
app.use('/seed',     seedRoutes)                // category/service seeding
app.use('/locations', locationRoutes)           // public location lookup

// ── Error handling ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Core service running on port ${PORT} in ${process.env.NODE_ENV ?? 'development'} mode`)
})

export default app
