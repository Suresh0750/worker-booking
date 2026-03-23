import 'dotenv/config'
import http    from 'http'
import express from 'express'
import helmet  from 'helmet'
import cors    from 'cors'
import { Server as SocketServer } from 'socket.io'
import chatRoutes          from './presentation/routes/chatRoutes'
import { setupChatGateway } from './presentation/gateways/ChatGateway'
import { logger }           from './infrastructure/config/logger'

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT ?? 3008

// ── Socket.io ─────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin:  process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout:  60000,
  pingInterval: 25000,
})

// Wire chat gateway (all socket events)
setupChatGateway(io)

// ── Express ───────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*', credentials: true }))
app.use(express.json({ limit: '10kb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chat-service', timestamp: new Date() })
})

app.use('/chat', chatRoutes)

// ── Start ─────────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`Chat service running on port ${PORT}`)
  logger.info(`Socket.io ready — ws://localhost:${PORT}`)
  logger.info(`Heartbeat interval: ${process.env.HEARTBEAT_INTERVAL_MS ?? 15000}ms`)
})

export default app
