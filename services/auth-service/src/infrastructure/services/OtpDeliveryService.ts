import { IOtpDeliveryService } from '../../domain/interfaces/IOtpDeliveryService'
import { logger } from '../config/logger'

// Delivery is pluggable — no SMTP/SMS provider is configured yet, so OTPs are
// logged to the console. Wire up a real provider (nodemailer, SES, Resend,
// Twilio, MSG91, ...) here when credentials are available.
export class OtpDeliveryService implements IOtpDeliveryService {
  async sendEmailOtp(to: string, code: string): Promise<void> {
    logger.info(`[OTP] Email verification code for ${to}: ${code}`)
  }

  async sendSmsOtp(to: string, code: string): Promise<void> {
    logger.info(`[OTP] Phone verification code for ${to}: ${code}`)
  }
}

const otpDeliveryService = new OtpDeliveryService();

export default otpDeliveryService
