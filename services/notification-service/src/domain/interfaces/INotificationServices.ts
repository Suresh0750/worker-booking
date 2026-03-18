import { NotificationPayload } from '../entities/Notification'

// ── Push notification service (FCM) ──────────────────────
export interface PushMessage {
  fcmToken: string
  title:    string
  body:     string
  data?:    Record<string, string>
}

export interface IPushService {
  send(message: PushMessage): Promise<void>
  sendMulticast(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>
}

// ── Socket.io real-time service ───────────────────────────
export interface ISocketService {
  emitToRoom(room: string, event: string, data: unknown): void
  emitToUser(userId: string, event: string, data: unknown): void
}

// ── Notification dispatcher ───────────────────────────────
export interface INotificationDispatcher {
  dispatch(payload: NotificationPayload): Promise<void>
}
