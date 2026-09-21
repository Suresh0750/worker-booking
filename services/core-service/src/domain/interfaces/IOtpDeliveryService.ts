export interface IOtpDeliveryService {
  sendEmailOtp(to: string, code: string): Promise<void>
  sendSmsOtp(to: string, code: string): Promise<void>
}
