import { OtpChannel, OtpEntity, OtpPurpose } from '../entities/Otp'

export interface CreateOtpInput {
  identifier:  string
  channel:     OtpChannel
  purpose:     OtpPurpose
  codeHash:    string
  expiresAt:   Date
  maxAttempts: number
}

export interface IOtpRepository {
  save(data: CreateOtpInput): Promise<OtpEntity>
  findLatestByIdentifierAndPurpose(
    identifier: string,
    purpose: OtpPurpose
  ): Promise<OtpEntity | null>
  markVerified(id: string): Promise<void>
  incrementAttempts(id: string): Promise<void>
}
