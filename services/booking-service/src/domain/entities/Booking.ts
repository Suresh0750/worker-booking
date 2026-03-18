export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface BookingEntity {
  id:           string
  userId:       string
  workerId:     string
  categoryId:   string
  userName:     string | null
  workerName:   string | null
  categoryName: string | null
  description:  string
  address:      string
  city:         string
  lat:          number | null
  lng:          number | null
  status:       BookingStatus
  priceAgreed:  number | null
  scheduledAt:  Date | null
  createdAt:    Date
  updatedAt:    Date
}

export interface BookingStatusLogEntity {
  id:          string
  bookingId:   string
  fromStatus:  BookingStatus | null
  toStatus:    BookingStatus
  changedBy:   string
  note:        string | null
  createdAt:   Date
}

export interface MessageEntity {
  id:         string
  bookingId:  string
  senderId:   string
  senderRole: string
  content:    string
  sentAt:     Date
}

// Valid status transitions — the state machine
export const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING:     ['ACCEPTED', 'CANCELLED'],
  ACCEPTED:    ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
}
