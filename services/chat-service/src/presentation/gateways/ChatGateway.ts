import { Server as SocketServer, Socket } from 'socket.io'
import { PrismaChatRepository }           from '../repositories/PrismaChatRepository'
import { PresenceStore }                  from '../services/PresenceStore'
import {
  conversationRoom,
  userRoom,
  HEARTBEAT_INTERVAL_MS,
} from '../../domain/entities/Chat'
import { logger } from '../config/logger'

const chatRepo = new PrismaChatRepository()

// Typing debounce store — userId → timeout
const typingTimeouts = new Map<string, NodeJS.Timeout>()

export function setupChatGateway(io: SocketServer): void {

  io.on('connection', (socket: Socket) => {
    const userId   = socket.handshake.auth?.userId   as string
    const userRole = socket.handshake.auth?.userRole as string

    if (!userId) {
      socket.disconnect()
      return
    }

    // Register presence
    PresenceStore.connect(userId, socket.id)

    // Join personal notification room
    socket.join(userRoom(userId))

    // Broadcast online status to everyone who shares a conversation
    broadcastPresence(io, userId, true)

    logger.info(`[chat] ${userId} (${userRole}) connected`)

    // ── Heartbeat ────────────────────────────────────────
    // Client sends this every HEARTBEAT_INTERVAL_MS
    // Payload: { activeConversationId: string | null }
    socket.on('heartbeat', ({ activeConversationId }: { activeConversationId: string | null }) => {
      PresenceStore.heartbeat(userId, activeConversationId)

      // Auto-mark messages as read if user is actively viewing the conversation
      if (activeConversationId) {
        chatRepo.markRead(activeConversationId, userId).catch(() => {})

        // Tell the other party their messages are read
        io.to(conversationRoom(activeConversationId)).emit('messages_read', {
          conversationId: activeConversationId,
          readBy:         userId,
          readAt:         new Date(),
        })
      }

      // Respond with server timestamp so client can sync
      socket.emit('heartbeat_ack', {
        serverTime: new Date(),
        intervalMs: HEARTBEAT_INTERVAL_MS,
      })
    })

    // ── Join conversation room ────────────────────────────
    socket.on('join_conversation', async ({ conversationId }: { conversationId: string }) => {
      // Verify user is part of this conversation
      const conv = await chatRepo.findConversationById(conversationId)
      if (!conv || (conv.userId !== userId && conv.workerId !== userId)) {
        socket.emit('error', { message: 'Access denied to this conversation' })
        return
      }

      socket.join(conversationRoom(conversationId))
      PresenceStore.heartbeat(userId, conversationId)

      // Mark messages as read immediately on join
      await chatRepo.markRead(conversationId, userId)

      // Tell others in the room this user is now active
      socket.to(conversationRoom(conversationId)).emit('user_active', {
        userId,
        conversationId,
        isActive: true,
      })

      // Send current active viewers to the joining user
      const viewers = PresenceStore.getActiveViewers(conversationId)
      socket.emit('active_viewers', { conversationId, viewers })

      logger.info(`[chat] ${userId} joined conversation ${conversationId}`)
    })

    // ── Leave conversation room ───────────────────────────
    socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.leave(conversationRoom(conversationId))
      PresenceStore.heartbeat(userId, null)

      socket.to(conversationRoom(conversationId)).emit('user_active', {
        userId,
        conversationId,
        isActive: false,
      })
    })

    // ── Send message ──────────────────────────────────────
    socket.on('send_message', async ({
      conversationId,
      content,
    }: {
      conversationId: string
      content:        string
    }) => {
      if (!content?.trim()) return

      try {
        // Verify membership
        const conv = await chatRepo.findConversationById(conversationId)
        if (!conv || (conv.userId !== userId && conv.workerId !== userId)) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        // Save to DB
        const message = await chatRepo.createMessage({
          conversationId,
          senderId:   userId,
          senderRole: userRole,
          content:    content.trim(),
        })

        // Emit to everyone in the conversation room (including sender)
        io.to(conversationRoom(conversationId)).emit('new_message', {
          ...message,
          isRead: false,
        })

        // If receiver is actively viewing this conversation → auto read
        const recipientId = conv.userId === userId ? conv.workerId : conv.userId
        if (PresenceStore.isViewingConversation(recipientId, conversationId)) {
          await chatRepo.markRead(conversationId, recipientId)
          io.to(conversationRoom(conversationId)).emit('messages_read', {
            conversationId,
            readBy: recipientId,
            readAt: new Date(),
          })
        } else {
          // Recipient is offline/elsewhere → send to personal room as notification
          io.to(userRoom(recipientId)).emit('new_message_notification', {
            conversationId,
            senderId:    userId,
            senderRole:  userRole,
            preview:     content.slice(0, 60),
            sentAt:      message.sentAt,
          })
        }

        // Clear typing indicator
        clearTyping(io, userId, conversationId)

      } catch (err: any) {
        logger.error(`[chat] send_message error: ${err.message}`)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // ── Typing indicator ──────────────────────────────────
    socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
      socket.to(conversationRoom(conversationId)).emit('typing', {
        userId,
        conversationId,
        isTyping: true,
      })

      // Auto-stop typing after 3s of no activity
      const key = `${userId}:${conversationId}`
      if (typingTimeouts.has(key)) clearTimeout(typingTimeouts.get(key)!)
      typingTimeouts.set(
        key,
        setTimeout(() => clearTyping(io, userId, conversationId), 3000),
      )
    })

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      clearTyping(io, userId, conversationId)
    })

    // ── Pin / unpin message ───────────────────────────────
    socket.on('pin_message', async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      await chatRepo.pinMessage(messageId)
      io.to(conversationRoom(conversationId)).emit('message_pinned', { messageId, pinnedBy: userId })
    })

    socket.on('unpin_message', async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
      await chatRepo.unpinMessage(messageId)
      io.to(conversationRoom(conversationId)).emit('message_unpinned', { messageId })
    })

    // ── Delete message ────────────────────────────────────
    socket.on('delete_message', async ({
      messageId,
      conversationId,
      role,
    }: {
      messageId:      string
      conversationId: string
      role:           'sender' | 'receiver'
    }) => {
      await chatRepo.deleteMessage(messageId, role)
      io.to(conversationRoom(conversationId)).emit('message_deleted', {
        messageId,
        deletedBy: userId,
        role,
      })
    })

    // ── Pin / unpin conversation ──────────────────────────
    socket.on('pin_conversation', async ({ conversationId }: { conversationId: string }) => {
      const role = userRole?.toLowerCase() === 'worker' ? 'worker' : 'user'
      await chatRepo.pinConversation(conversationId, role, true)
      socket.emit('conversation_pinned', { conversationId, pinned: true })
    })

    socket.on('unpin_conversation', async ({ conversationId }: { conversationId: string }) => {
      const role = userRole?.toLowerCase() === 'worker' ? 'worker' : 'user'
      await chatRepo.pinConversation(conversationId, role, false)
      socket.emit('conversation_pinned', { conversationId, pinned: false })
    })

    // ── Disconnect ────────────────────────────────────────
    socket.on('disconnect', () => {
      PresenceStore.disconnect(userId)
      broadcastPresence(io, userId, false)
      logger.info(`[chat] ${userId} disconnected`)
    })
  })

  // ── Cleanup stale presences every 5 minutes ───────────
  setInterval(() => PresenceStore.cleanup(), 5 * 60 * 1000)
}

// ── Helpers ───────────────────────────────────────────────
function clearTyping(io: SocketServer, userId: string, conversationId: string): void {
  const key = `${userId}:${conversationId}`
  if (typingTimeouts.has(key)) {
    clearTimeout(typingTimeouts.get(key)!)
    typingTimeouts.delete(key)
  }
  io.to(conversationRoom(conversationId)).emit('typing', {
    userId,
    conversationId,
    isTyping: false,
  })
}

async function broadcastPresence(io: SocketServer, userId: string, isOnline: boolean): Promise<void> {
  try {
    // Find all conversations this user is in and notify the other party
    const [userConvs, workerConvs] = await Promise.all([
      chatRepo.findUserConversations(userId),
      chatRepo.findWorkerConversations(userId),
    ])

    const allConvs = [...userConvs, ...workerConvs]
    for (const conv of allConvs) {
      io.to(conversationRoom(conv.id)).emit('presence_update', {
        userId,
        isOnline,
        lastSeen: new Date(),
      })
    }
  } catch {
    // Non-critical
  }
}
