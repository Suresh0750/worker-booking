export interface NotifyPayload {
  eventType: string
  data: {
    bookingId:  string
    userId:     string
    workerId:   string
    status?:    string
    message?:   string
  }
}

export interface INotificationClient {
  notify(payload: NotifyPayload): Promise<void>
}
