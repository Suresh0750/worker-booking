import admin from 'firebase-admin'
import { IPushService, PushMessage } from '../../domain/interfaces/INotificationServices'
import { logger } from '../config/logger'

// Initialize Firebase Admin once
let firebaseInitialized = false

function initFirebase(): void {
  if (firebaseInitialized) return

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase credentials not set — push notifications disabled')
    return
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })

  firebaseInitialized = true
  logger.info('Firebase Admin initialized')
}

export class FCMPushService implements IPushService {
  constructor() {
    initFirebase()
  }

  async send(message: PushMessage): Promise<void> {
    if (!firebaseInitialized) return

    try {
      await admin.messaging().send({
        token:        message.fcmToken,
        notification: { title: message.title, body: message.body },
        data:         message.data ?? {},
        android: { priority: 'high' },
        apns:    { payload: { aps: { sound: 'default' } } },
      })
      logger.info(`Push sent to token: ${message.fcmToken.slice(0, 20)}...`)
    } catch (err: any) {
      // Token may be invalid/expired — log and continue
      logger.error(`FCM send failed: ${err.message}`)
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!firebaseInitialized || tokens.length === 0) return

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data:         data ?? {},
        android:      { priority: 'high' },
        apns:         { payload: { aps: { sound: 'default' } } },
      })
      logger.info(`Multicast: ${response.successCount}/${tokens.length} sent`)
    } catch (err: any) {
      logger.error(`FCM multicast failed: ${err.message}`)
    }
  }
}
