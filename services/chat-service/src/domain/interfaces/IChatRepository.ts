import { ConversationEntity, MessageEntity } from '../entities/Chat'

export interface CreateConversationInput {
  bookingId: string
  userId:    string
  workerId:  string
}

export interface CreateMessageInput {
  conversationId: string
  senderId:       string
  senderRole:     string
  content:        string
}

export interface IChatRepository {
  // Conversations
  findConversationById(id: string): Promise<ConversationEntity | null>
  findConversationByBooking(bookingId: string): Promise<ConversationEntity | null>
  findUserConversations(userId: string): Promise<ConversationEntity[]>
  findWorkerConversations(workerId: string): Promise<ConversationEntity[]>
  createConversation(data: CreateConversationInput): Promise<ConversationEntity>
  pinConversation(id: string, role: 'user' | 'worker', pin: boolean): Promise<void>
  updateLastMessage(id: string, content: string): Promise<void>

  // Messages
  getMessages(conversationId: string, limit?: number, before?: Date): Promise<MessageEntity[]>
  createMessage(data: CreateMessageInput): Promise<MessageEntity>
  markRead(conversationId: string, readerId: string): Promise<void>
  pinMessage(messageId: string): Promise<void>
  unpinMessage(messageId: string): Promise<void>
  getPinnedMessages(conversationId: string): Promise<MessageEntity[]>
  deleteMessage(messageId: string, deletedBy: 'sender' | 'receiver'): Promise<void>
}
