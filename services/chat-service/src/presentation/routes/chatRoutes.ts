import { Router, Request, Response, NextFunction } from 'express'
import { PrismaChatRepository } from '../../infrastructure/repositories/PrismaChatRepository'
import { PresenceStore }        from '../../infrastructure/services/PresenceStore'

const router   = Router()
const chatRepo = new PrismaChatRepository()

// All routes expect x-user-id + x-user-role headers from API Gateway

// GET /chat/conversations — list my conversations
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId   = req.headers['x-user-id']   as string
    const userRole = req.headers['x-user-role'] as string

    const conversations = userRole?.toLowerCase() === 'worker'
      ? await chatRepo.findWorkerConversations(userId)
      : await chatRepo.findUserConversations(userId)

    // Enrich with online status
    const enriched = conversations.map((c) => {
      const otherId   = c.userId === userId ? c.workerId : c.userId
      return { ...c, isOtherOnline: PresenceStore.isOnline(otherId) }
    })

    res.json({ success: true, data: enriched })
  } catch (err) { next(err) }
})

// POST /chat/conversations — create or get existing conversation for a booking
router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId   = req.headers['x-user-id'] as string
    const { bookingId, workerId } = req.body

    const conversation = await chatRepo.createConversation({
      bookingId,
      userId,
      workerId,
    })

    res.status(201).json({ success: true, data: conversation })
  } catch (err) { next(err) }
})

// GET /chat/conversations/:id/messages — paginated message history
router.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string
    const conv   = await chatRepo.findConversationById(req.params.id)

    if (!conv || (conv.userId !== userId && conv.workerId !== userId)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const before   = req.query.before ? new Date(req.query.before as string) : undefined
    const limit    = parseInt(req.query.limit as string ?? '50')
    const messages = await chatRepo.getMessages(req.params.id, limit, before)

    res.json({ success: true, data: messages })
  } catch (err) { next(err) }
})

// GET /chat/conversations/:id/pinned — pinned messages
router.get('/conversations/:id/pinned', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await chatRepo.getPinnedMessages(req.params.id)
    res.json({ success: true, data: messages })
  } catch (err) { next(err) }
})

// GET /chat/presence/:userId — check if a user is online
router.get('/presence/:userId', (req: Request, res: Response) => {
  const presence = PresenceStore.getPresence(req.params.userId)
  res.json({
    success: true,
    data: {
      userId:   req.params.userId,
      isOnline: presence?.isOnline ?? false,
      lastSeen: presence?.lastSeen ?? null,
    },
  })
})

// GET /chat/health
router.get('/health', (_req, res) => {
  const stats = PresenceStore.getStats()
  res.json({ success: true, ...stats })
})

export default router
