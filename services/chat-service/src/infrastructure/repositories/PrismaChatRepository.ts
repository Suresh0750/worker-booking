import { PrismaClient }     from '@prisma/client'
import { IChatRepository, CreateConversationInput, CreateMessageInput } from '../../domain/interfaces/IChatRepository'
import { ConversationEntity, MessageEntity } from '../../domain/entities/Chat'

const prisma = new PrismaClient()

export class PrismaChatRepository implements IChatRepository {

  async findConversationById(id: string): Promise<ConversationEntity | null> {
    return prisma.conversation.findUnique({ where: { id } }) as Promise<ConversationEntity | null>
  }

  async findConversationByBooking(bookingId: string): Promise<ConversationEntity | null> {
    return prisma.conversation.findUnique({ where: { bookingId } }) as Promise<ConversationEntity | null>
  }

  async findUserConversations(userId: string): Promise<ConversationEntity[]> {
    return prisma.conversation.findMany({
      where:   { userId },
      orderBy: [{ isPinnedByUser: 'desc' }, { lastSentAt: 'desc' }],
    }) as Promise<ConversationEntity[]>
  }

  async findWorkerConversations(workerId: string): Promise<ConversationEntity[]> {
    return prisma.conversation.findMany({
      where:   { workerId },
      orderBy: [{ isPinnedByWorker: 'desc' }, { lastSentAt: 'desc' }],
    }) as Promise<ConversationEntity[]>
  }

  async createConversation(data: CreateConversationInput): Promise<ConversationEntity> {
    return prisma.conversation.upsert({
      where:  { bookingId: data.bookingId },
      update: {},
      create: { bookingId: data.bookingId, userId: data.userId, workerId: data.workerId },
    }) as Promise<ConversationEntity>
  }

  async pinConversation(id: string, role: 'user' | 'worker', pin: boolean): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data:  role === 'user' ? { isPinnedByUser: pin } : { isPinnedByWorker: pin },
    })
  }

  async updateLastMessage(id: string, content: string): Promise<void> {
    await prisma.conversation.update({
      where: { id },
      data:  { lastMessage: content, lastSentAt: new Date() },
    })
  }

  async getMessages(conversationId: string, limit = 50, before?: Date): Promise<MessageEntity[]> {
    return prisma.message.findMany({
      where: {
        conversationId,
        ...(before ? { sentAt: { lt: before } } : {}),
        isDeletedBySender:   false,
        isDeletedByReceiver: false,
      },
      orderBy: { sentAt: 'asc' },
      take:    limit,
    }) as Promise<MessageEntity[]>
  }

  async createMessage(data: CreateMessageInput): Promise<MessageEntity> {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId:       data.senderId,
        senderRole:     data.senderRole,
        content:        data.content,
      },
    })
    await this.updateLastMessage(data.conversationId, data.content)
    return message as MessageEntity
  }

  async markRead(conversationId: string, readerId: string): Promise<void> {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: readerId },
        readAt:   null,
      },
      data: { readAt: new Date() },
    })
  }

  async pinMessage(messageId: string): Promise<void> {
    await prisma.message.update({ where: { id: messageId }, data: { isPinned: true } })
  }

  async unpinMessage(messageId: string): Promise<void> {
    await prisma.message.update({ where: { id: messageId }, data: { isPinned: false } })
  }

  async getPinnedMessages(conversationId: string): Promise<MessageEntity[]> {
    return prisma.message.findMany({
      where:   { conversationId, isPinned: true },
      orderBy: { sentAt: 'desc' },
    }) as Promise<MessageEntity[]>
  }

  async deleteMessage(messageId: string, deletedBy: 'sender' | 'receiver'): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data:  deletedBy === 'sender'
        ? { isDeletedBySender: true }
        : { isDeletedByReceiver: true },
    })
  }
}
