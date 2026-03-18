import { prisma } from '../config/prisma'
import {
  IBookingRepository,
  CreateBookingInput,
  UpdateStatusInput,
  UpdatePriceInput,
  CreateMessageInput,
  FindBookingsInput,
} from '../../domain/interfaces/IBookingRepository'
import { BookingEntity, BookingStatusLogEntity, MessageEntity } from '../../domain/entities/Booking'

export class PrismaBookingRepository implements IBookingRepository {
  async findById(id: string): Promise<BookingEntity | null> {
    return prisma.booking.findUnique({ where: { id } }) as Promise<BookingEntity | null>
  }

  async findMany(input: FindBookingsInput): Promise<{ data: BookingEntity[]; total: number }> {
    const { userId, workerId, status, page = 1, limit = 10 } = input
    const skip = (page - 1) * limit

    const where = {
      ...(userId   ? { userId }   : {}),
      ...(workerId ? { workerId } : {}),
      ...(status   ? { status }   : {}),
    }

    const [data, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ])

    return { data: data as BookingEntity[], total }
  }

  async create(data: CreateBookingInput): Promise<BookingEntity> {
    return prisma.booking.create({
      data: {
        userId:       data.userId,
        workerId:     data.workerId,
        categoryId:   data.categoryId,
        userName:     data.userName,
        workerName:   data.workerName,
        categoryName: data.categoryName,
        description:  data.description,
        address:      data.address,
        city:         data.city,
        lat:          data.lat,
        lng:          data.lng,
        scheduledAt:  data.scheduledAt,
        // Create first status log entry
        statusLogs: {
          create: {
            fromStatus: null,
            toStatus:   'PENDING',
            changedBy:  data.userId,
            note:       'Booking created',
          },
        },
      },
    }) as Promise<BookingEntity>
  }

  async updateStatus(id: string, input: UpdateStatusInput): Promise<BookingEntity> {
    const current = await prisma.booking.findUnique({ where: { id } })

    const [updated] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data:  { status: input.status as any },
      }),
      prisma.bookingStatusLog.create({
        data: {
          bookingId:  id,
          fromStatus: current?.status,
          toStatus:   input.status as any,
          changedBy:  input.changedBy,
          note:       input.note,
        },
      }),
    ])

    return updated as BookingEntity
  }

  async updatePrice(id: string, input: UpdatePriceInput): Promise<BookingEntity> {
    return prisma.booking.update({
      where: { id },
      data:  { priceAgreed: input.priceAgreed },
    }) as Promise<BookingEntity>
  }

  async getStatusLogs(bookingId: string): Promise<BookingStatusLogEntity[]> {
    return prisma.bookingStatusLog.findMany({
      where:   { bookingId },
      orderBy: { createdAt: 'asc' },
    }) as Promise<BookingStatusLogEntity[]>
  }

  async createMessage(data: CreateMessageInput): Promise<MessageEntity> {
    return prisma.message.create({
      data: {
        bookingId:  data.bookingId,
        senderId:   data.senderId,
        senderRole: data.senderRole,
        content:    data.content,
      },
    }) as Promise<MessageEntity>
  }

  async getMessages(bookingId: string): Promise<MessageEntity[]> {
    return prisma.message.findMany({
      where:   { bookingId },
      orderBy: { sentAt: 'asc' },
    }) as Promise<MessageEntity[]>
  }
}
