export interface ConversationEntity {
  id:               string
  bookingId:        string
  userId:           string
  workerId:         string
  lastMessage:      string | null
  lastSentAt:       Date | null
  isPinnedByUser:   boolean
  isPinnedByWorker: boolean
  createdAt:        Date
  updatedAt:        Date
}

export interface MessageEntity {
  id:                    string
  conversationId:        string
  senderId:              string
  senderRole:            string
  content:               string
  isPinned:              boolean
  isDeletedBySender:     boolean
  isDeletedByReceiver:   boolean
  readAt:                Date | null
  sentAt:                Date
}

// ── Heartbeat / Presence tracking ────────────────────────
export interface UserPresence {
  userId:         string
  socketId:       string
  isOnline:       boolean
  lastSeen:       Date
  activeConversationId: string | null  // which chat they have open
  heartbeatAt:    Date
}

// Room naming helpers
export const conversationRoom = (id: string) => `conversation:${id}`
export const userRoom         = (id: string) => `user:${id}`

// Heartbeat config
export const HEARTBEAT_INTERVAL_MS = 15_000  // client sends every 15s
export const OFFLINE_TIMEOUT_MS    = 45_000  // mark offline after 45s no heartbeat
