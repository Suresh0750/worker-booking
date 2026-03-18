import { IBookingRepository }  from '../../domain/interfaces/IBookingRepository'
import { INotificationClient } from '../../domain/interfaces/INotificationClient'
import { STATUS_TRANSITIONS }  from '../../domain/entities/Booking'
import { UpdateStatusDto, BookingResponseDto } from '../dtos/BookingDto'

export class UpdateBookingStatus {
  constructor(
    private readonly bookingRepo: IBookingRepository,
    private readonly notificationClient: INotificationClient,
  ) {}

  async execute(
    bookingId: string,
    requesterId: string,
    dto: UpdateStatusDto,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findById(bookingId)

    if (!booking) {
      const err = new Error('Booking not found')
      ;(err as any).status = 404
      throw err
    }

    // Ownership check — only the user or worker on this booking can change status
    if (booking.userId !== requesterId && booking.workerId !== requesterId) {
      const err = new Error('Forbidden — you are not part of this booking')
      ;(err as any).status = 403
      throw err
    }

    // State machine check — validate the transition is allowed
    const allowed = STATUS_TRANSITIONS[booking.status]
    if (!allowed.includes(dto.status)) {
      const err = new Error(
        `Cannot move from ${booking.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      )
      ;(err as any).status = 400
      throw err
    }

    // Update status + log the change
    const updated = await this.bookingRepo.updateStatus(bookingId, {
      status:    dto.status,
      changedBy: requesterId,
      note:      dto.note,
    })

    // Notify the other party — non-blocking
    // Kafka migration: producer.publish('booking.status.changed', payload)
    const notifyUserId = requesterId === booking.userId ? booking.workerId : booking.userId
    await this.notificationClient.notify({
      eventType: 'booking_status_changed',
      data: {
        bookingId: booking.id,
        userId:    notifyUserId,
        workerId:  booking.workerId,
        status:    dto.status,
        message:   `Booking status updated to ${dto.status}`,
      },
    })

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
