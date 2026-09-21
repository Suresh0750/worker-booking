import { IOtpDeliveryService } from '@domain/interfaces/IOtpDeliveryService'
import { logger } from '../config/logger'

// Delivery is pluggable — no SMTP/SMS provider configured yet.
// Wire up a real provider (Nodemailer, SES, Resend, Twilio, MSG91…)
// by replacing the log calls below.
export class OtpDeliveryService implements IOtpDeliveryService {
  async sendEmailOtp(to: string, code: string): Promise<void> {
    logger.info(`[OTP] Email verification code for ${to}: ${code}`)
    // TODO: await mailer.send({ to, subject: 'Your OTP', text: `Your code: ${code}` })
  }

  async sendSmsOtp(to: string, code: string): Promise<void> {
    logger.info(`[OTP] SMS verification code for ${to}: ${code}`)
    // TODO: await smsProvider.send({ to, message: `Your code: ${code}` })
  }
}

export default new OtpDeliveryService()
