export type NotificationEventType =
  | 'booking_created'         // worker receives — user sent hire request
  | 'booking_status_changed'  // user receives — worker accepted/started/completed
  | 'booking_cancelled'       // both receive
  | 'new_message'             // both receive — new chat message
  | 'review_submitted'        // worker receives — user left a review

export interface NotificationPayload {
  eventType: NotificationEventType
  data: {
    bookingId:  string
    userId:     string
    workerId:   string
    status?:    string
    message?:   string
  }
}

// FCM device token — stored per user/worker
// In a real app you would store these in a database
// For now we keep them in memory (they register on socket connect)
export interface DeviceToken {
  userId:    string
  fcmToken:  string
  platform:  'ios' | 'android' | 'web'
}

// Socket room — each booking gets its own chat room
export const bookingRoom = (bookingId: string): string => `booking:${bookingId}`
export const userRoom    = (userId: string):    string => `user:${userId}`
