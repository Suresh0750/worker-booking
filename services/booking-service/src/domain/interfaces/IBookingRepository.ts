import { BookingEntity, BookingStatus, MessageEntity, BookingStatusLogEntity } from '../entities/Booking'

export interface CreateBookingInput {
  userId:       string
  workerId:     string
  categoryId:   string
  userName?:    string
  workerName?:  string
  categoryName?: string
  description:  string
  address:      string
  city:         string
  lat?:         number
  lng?:         number
  scheduledAt?: Date
}

export interface UpdateStatusInput {
  status:    BookingStatus
  changedBy: string
  note?:     string
}

export interface UpdatePriceInput {
  priceAgreed: number
}

export interface CreateMessageInput {
  bookingId:  string
  senderId:   string
  senderRole: string
  content:    string
}

export interface FindBookingsInput {
  userId?:   string
  workerId?: string
  status?:   BookingStatus
  page?:     number
  limit?:    number
}

export interface IBookingRepository {
  findById(id: string): Promise<BookingEntity | null>
  findMany(input: FindBookingsInput): Promise<{ data: BookingEntity[]; total: number }>
  create(data: CreateBookingInput): Promise<BookingEntity>
  updateStatus(id: string, input: UpdateStatusInput): Promise<BookingEntity>
  updatePrice(id: string, input: UpdatePriceInput): Promise<BookingEntity>
  getStatusLogs(bookingId: string): Promise<BookingStatusLogEntity[]>
  createMessage(data: CreateMessageInput): Promise<MessageEntity>
  getMessages(bookingId: string): Promise<MessageEntity[]>
}
