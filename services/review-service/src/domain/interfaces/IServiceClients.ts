// ── Booking Service client ────────────────────────────────
export interface BookingVerifyResponse {
  isEligible: boolean
  workerId:   string
  userId:     string
  status:     string
}

export interface IBookingClient {
  verifyBooking(bookingId: string, userId: string): Promise<BookingVerifyResponse>
}

// ── Worker Service client ─────────────────────────────────
export interface IWorkerClient {
  updateRating(workerId: string, avgRating: number, totalReviews: number): Promise<void>
}
