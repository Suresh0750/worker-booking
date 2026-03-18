import { IBookingRepository } from '../../domain/interfaces/IBookingRepository'
import {
  BookingResponseDto,
  BookingListResponseDto,
  MessageResponseDto,
  GetBookingsDto,
  SendMessageDto,
  UpdatePriceDto,
} from '../dtos/BookingDto'

// ── Get single booking ────────────────────────────────────
export class GetBooking {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  async execute(bookingId: string, requesterId: string): Promise<BookingResponseDto & { messages: MessageResponseDto[] }> {
    const booking = await this.bookingRepo.findById(bookingId)

    if (!booking) {
      const err = new Error('Booking not found')
      ;(err as any).status = 404
      throw err
    }

    // Only user and worker on the booking can see it
    if (booking.userId !== requesterId && booking.workerId !== requesterId) {
      const err = new Error('Forbidden')
      ;(err as any).status = 403
      throw err
    }

    const messages = await this.bookingRepo.getMessages(bookingId)

    return {
      id:           booking.id,
      userId:       booking.userId,
      workerId:     booking.workerId,
      categoryId:   booking.categoryId,
      userName:     booking.userName,
      workerName:   booking.workerName,
      categoryName: booking.categoryName,
      description:  booking.description,
      address:      booking.address,
      city:         booking.city,
      status:       booking.status,
      priceAgreed:  booking.priceAgreed,
      scheduledAt:  booking.scheduledAt,
      createdAt:    booking.createdAt,
      updatedAt:    booking.updatedAt,
      messages,
    }
  }
}

// ── Get my bookings list ──────────────────────────────────
export class GetMyBookings {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  async execute(
    requesterId: string,
    role: 'user' | 'worker',
    dto: GetBookingsDto,
  ): Promise<BookingListResponseDto> {
    const page  = dto.page  ?? 1
    const limit = dto.limit ?? 10

    const { data, total } = await this.bookingRepo.findMany({
      ...(role === 'user'   ? { userId:   requesterId } : {}),
      ...(role === 'worker' ? { workerId: requesterId } : {}),
      status: dto.status,
      page,
      limit,
    })

    return {
      data: data.map((b) => ({
        id:           b.id,
        userId:       b.userId,
        workerId:     b.workerId,
        categoryId:   b.categoryId,
        userName:     b.userName,
        workerName:   b.workerName,
        categoryName: b.categoryName,
        description:  b.description,
        address:      b.address,
        city:         b.city,
        status:       b.status,
        priceAgreed:  b.priceAgreed,
        scheduledAt:  b.scheduledAt,
        createdAt:    b.createdAt,
        updatedAt:    b.updatedAt,
      })),
      total,
      page,
      limit,
    }
  }
}

// ── Send message ──────────────────────────────────────────
export class SendMessage {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  async execute(
    bookingId: string,
    senderId: string,
    senderRole: string,
    dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const booking = await this.bookingRepo.findById(bookingId)

    if (!booking) {
      const err = new Error('Booking not found')
      ;(err as any).status = 404
      throw err
    }

    if (booking.userId !== senderId && booking.workerId !== senderId) {
      const err = new Error('Forbidden')
      ;(err as any).status = 403
      throw err
    }

    // Cannot message on cancelled or if not yet accepted
    if (booking.status === 'CANCELLED') {
      const err = new Error('Cannot send message on a cancelled booking')
      ;(err as any).status = 400
      throw err
    }

    return this.bookingRepo.createMessage({
      bookingId,
      senderId,
      senderRole,
      content: dto.content,
    })
  }
}

// ── Update agreed price ───────────────────────────────────
export class UpdateBookingPrice {
  constructor(private readonly bookingRepo: IBookingRepository) {}

  async execute(
    bookingId: string,
    requesterId: string,
    dto: UpdatePriceDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findById(bookingId)

    if (!booking) {
      const err = new Error('Booking not found')
      ;(err as any).status = 404
      throw err
    }

    if (booking.userId !== requesterId && booking.workerId !== requesterId) {
      const err = new Error('Forbidden')
      ;(err as any).status = 403
      throw err
    }

    if (!['PENDING', 'ACCEPTED'].includes(booking.status)) {
      const err = new Error('Price can only be updated before work starts')
      ;(err as any).status = 400
      throw err
    }

    const updated = await this.bookingRepo.updatePrice(bookingId, { priceAgreed: dto.priceAgreed })

    return {
      id:           updated.id,
      userId:       updated.userId,
      workerId:     updated.workerId,
      categoryId:   updated.categoryId,
      userName:     updated.userName,
      workerName:   updated.workerName,
      categoryName: updated.categoryName,
      description:  updated.description,
      address:      updated.address,
      city:         updated.city,
      status:       updated.status,
      priceAgreed:  updated.priceAgreed,
      scheduledAt:  updated.scheduledAt,
      createdAt:    updated.createdAt,
      updatedAt:    updated.updatedAt,
    }
  }
}
