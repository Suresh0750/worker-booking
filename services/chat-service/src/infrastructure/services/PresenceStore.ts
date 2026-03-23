import { UserPresence, OFFLINE_TIMEOUT_MS } from '../../domain/entities/Chat'
import { logger } from '../config/logger'

/**
 * PresenceStore tracks:
 * 1. Online/offline status via heartbeat timestamps
 * 2. Which conversation a user currently has open (activeConversationId)
 * 3. Socket ID for direct messaging
 *
 * In production with multiple instances → move to Redis
 * All methods are synchronous for speed — no async DB calls on the hot path
 */
class PresenceStoreClass {
  private users = new Map<string, UserPresence>()

  // Called on socket connect
  connect(userId: string, socketId: string): void {
    const existing = this.users.get(userId)
    this.users.set(userId, {
      userId,
      socketId,
      isOnline:             true,
      lastSeen:             new Date(),
      activeConversationId: existing?.activeConversationId ?? null,
      heartbeatAt:          new Date(),
    })
    logger.info(`[presence] ${userId} connected (${socketId})`)
  }

  // Called on socket disconnect
  disconnect(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      user.isOnline             = false
      user.lastSeen             = new Date()
      user.activeConversationId = null
    }
    logger.info(`[presence] ${userId} disconnected`)
  }

  // Called every HEARTBEAT_INTERVAL_MS from client
  heartbeat(userId: string, activeConversationId: string | null): void {
    const user = this.users.get(userId)
    if (user) {
      user.heartbeatAt          = new Date()
      user.isOnline             = true
      user.activeConversationId = activeConversationId
    }
  }

  // Returns whether a user is actively viewing a specific conversation
  isViewingConversation(userId: string, conversationId: string): boolean {
    const user = this.users.get(userId)
    if (!user || !user.isOnline) return false
    return user.activeConversationId === conversationId
  }

  getPresence(userId: string): UserPresence | null {
    const user = this.users.get(userId)
    if (!user) return null

    // Auto-mark offline if heartbeat is stale
    const staleness = Date.now() - user.heartbeatAt.getTime()
    if (staleness > OFFLINE_TIMEOUT_MS) {
      user.isOnline             = false
      user.activeConversationId = null
    }

    return user
  }

  isOnline(userId: string): boolean {
    return this.getPresence(userId)?.isOnline ?? false
  }

  getSocketId(userId: string): string | null {
    return this.getPresence(userId)?.socketId ?? null
  }

  // Returns all users currently viewing a conversation room
  getActiveViewers(conversationId: string): string[] {
    const viewers: string[] = []
    for (const [userId, presence] of this.users.entries()) {
      if (presence.isOnline && presence.activeConversationId === conversationId) {
        viewers.push(userId)
      }
    }
    return viewers
  }

  // Cleanup stale entries — run periodically
  cleanup(): void {
    const now   = Date.now()
    let removed = 0
    for (const [userId, user] of this.users.entries()) {
      if (!user.isOnline && now - user.lastSeen.getTime() > 24 * 60 * 60 * 1000) {
        this.users.delete(userId)
        removed++
      }
    }
    if (removed > 0) logger.info(`[presence] Cleaned up ${removed} stale entries`)
  }

  getStats() {
    let online = 0
    for (const user of this.users.values()) {
      if (user.isOnline) online++
    }
    return { total: this.users.size, online }
  }
}

export const PresenceStore = new PresenceStoreClass()
