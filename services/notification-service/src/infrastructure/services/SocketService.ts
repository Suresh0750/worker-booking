import { Server as SocketServer } from 'socket.io'
import { ISocketService }         from '../../domain/interfaces/INotificationServices'
import { TokenStore }             from './TokenStore'
import { bookingRoom, userRoom }  from '../../domain/entities/Notification'
import { logger }                 from '../config/logger'

export class SocketService implements ISocketService {
  private io: SocketServer

  constructor(io: SocketServer) {
    this.io = io
    this.setupHandlers()
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth?.userId as string

      if (!userId) {
        socket.disconnect()
        return
      }

      logger.info(`Socket connected: ${socket.id} userId: ${userId}`)

      // Join user's personal room — receives notifications for them
      socket.join(userRoom(userId))

      // ── Client events ─────────────────────────────────
      // Client joins a booking room when they open a booking
      socket.on('join_booking', (bookingId: string) => {
        socket.join(bookingRoom(bookingId))
        logger.info(`User ${userId} joined booking room: ${bookingId}`)
      })

      // Client leaves a booking room
      socket.on('leave_booking', (bookingId: string) => {
        socket.leave(bookingRoom(bookingId))
        logger.info(`User ${userId} left booking room: ${bookingId}`)
      })

      // Client registers their FCM token for push when offline
      socket.on('register_token', (fcmToken: string) => {
        if (fcmToken) {
          TokenStore.register(userId, fcmToken)
        }
      })

      // Client unregisters token (logout)
      socket.on('unregister_token', (fcmToken: string) => {
        if (fcmToken) {
          TokenStore.unregister(userId, fcmToken)
        }
      })

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id} userId: ${userId}`)
      })
    })
  }

  emitToRoom(room: string, event: string, data: unknown): void {
    this.io.to(room).emit(event, data)
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(userRoom(userId)).emit(event, data)
  }
}
