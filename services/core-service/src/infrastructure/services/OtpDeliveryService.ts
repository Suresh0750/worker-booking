import { IOtpDeliveryService } from '@domain/interfaces/IOtpDeliveryService'
import { logger } from '../config/logger'
import { mailer } from '@infrastructure/config/mailer';

export class OtpDeliveryService implements IOtpDeliveryService {

  async sendEmailOtp(to: string, code: string): Promise<void> {
  await mailer.sendMail({
    from: `"Worker App" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your Worker App Verification Code",
    text: `Your verification code is: ${code}. This code will expire soon.`,
    html: `
      <div>
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1>${code}</h1>
        <p>This code will expire soon.</p>
        <p>If you didn't request this code, you can ignore this email.</p>
      </div>
    `,
  });

  logger.info(`[OTP] Verification email sent to ${to}`);
}

  async sendSmsOtp(to: string, code: string): Promise<void> {
    logger.info(`[OTP] SMS verification code for ${to}: ${code}`)
    // TODO: await smsProvider.send({ to, message: `Your code: ${code}` })
  }
}

export default new OtpDeliveryService()
