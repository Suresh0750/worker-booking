import 'dotenv/config'
import http           from 'http'
import express        from 'express'
import helmet         from 'helmet'
import cors           from 'cors'
import rateLimit      from 'express-rate-limit'
import { Server as SocketServer } from 'socket.io'

import internalRoutes from './presentation/routes/internalRoutes'
import { errorHandler, notFoundHandler } from './presentation/middlewares/index'
import { setDispatcher } from './presentation/controllers/NotificationController'

import { FCMPushService }        from './infrastructure/services/FCMPushService'
import { SocketService }         from './infrastructure/services/SocketService'
import { TokenStore }            from './infrastructure/services/TokenStore'
import { NotificationDispatcher } from './application/use-cases/NotificationDispatcher'
import { logger }                from './infrastructure/config/logger'

const app    = express()
const server = http.createServer(app) // Socket.io needs raw http.Server
const PORT   = process.env.PORT ?? 3007

// ── Socket.io setup ───────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin:      process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  // Client must send userId in auth handshake:
  // socket = io('http://localhost:3007', { auth: { userId: 'abc-123' } })
})

// ── Wire dependencies ─────────────────────────────────────
const pushService   = new FCMPushService()
const socketService = new SocketService(io)
const dispatcher    = new NotificationDispatcher(pushService, socketService, TokenStore)

// Inject dispatcher into controller
setDispatcher(dispatcher)

// ── Express security ──────────────────────────────────────
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
    status:       'ok',
    service:      'notification-service',
    socketClients: io.engine.clientsCount,
    uptime:       process.uptime(),
    timestamp:    new Date().toISOString(),
  })
})

// ── Routes ────────────────────────────────────────────────
app.use('/internal', internalRoutes)

// ── Error handling ────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Start — use server.listen not app.listen ──────────────
// Must use http.Server so Socket.io shares the same port
server.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT} in ${process.env.NODE_ENV} mode`)
  logger.info(`Socket.io ready — clients connect to ws://localhost:${PORT}`)
})

export default app
