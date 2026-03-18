import { IBookingRepository } from '../../domain/interfaces/IBookingRepository'
import { INotificationClient } from '../../domain/interfaces/INotificationClient'
import { CreateBookingDto, BookingResponseDto } from '../dtos/BookingDto'

export class CreateBooking {
  constructor(
    private readonly bookingRepo: IBookingRepository,
    private readonly notificationClient: INotificationClient,
  ) {}

  async execute(userId: string, dto: CreateBookingDto): Promise<BookingResponseDto> {
    // Create the booking — status starts as PENDING automatically
    const booking = await this.bookingRepo.create({
      userId,
      workerId:    dto.workerId,
      categoryId:  dto.categoryId,
      description: dto.description,
      address:     dto.address,
      city:        dto.city,
      lat:         dto.lat,
      lng:         dto.lng,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    })

    // Notify worker — non-blocking, Kafka replaces this later
    // eventType: "booking_created" → worker gets push notification
    await this.notificationClient.notify({
      eventType: 'booking_created',
      data: {
        bookingId: booking.id,
        userId:    booking.userId,
        workerId:  booking.workerId,
        message:   `New hire request from ${booking.userName ?? 'a user'}`,
      },
    })

    return this.toDto(booking)
  }

  private toDto(booking: any): BookingResponseDto {
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
    }
  }
}
