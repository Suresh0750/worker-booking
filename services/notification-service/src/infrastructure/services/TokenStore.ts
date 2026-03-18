import { logger } from '../config/logger'

// In-memory store for FCM device tokens
// In production with multiple instances: move this to Redis
// Key: userId → Set of FCM tokens (user may have multiple devices)
class TokenStoreClass {
  private tokens = new Map<string, Set<string>>()

  register(userId: string, fcmToken: string): void {
    if (!this.tokens.has(userId)) {
      this.tokens.set(userId, new Set())
    }
    this.tokens.get(userId)!.add(fcmToken)
    logger.info(`FCM token registered for user ${userId}`)
  }

  unregister(userId: string, fcmToken: string): void {
    this.tokens.get(userId)?.delete(fcmToken)
    logger.info(`FCM token unregistered for user ${userId}`)
  }

  getTokens(userId: string): string[] {
    return Array.from(this.tokens.get(userId) ?? [])
  }

  clearUser(userId: string): void {
    this.tokens.delete(userId)
  }
}

// Export as singleton
export const TokenStore = new TokenStoreClass()
export type { TokenStoreClass }
