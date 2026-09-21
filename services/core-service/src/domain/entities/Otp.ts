export type OtpChannel = 'EMAIL' | 'SMS'
export type OtpPurpose =
  | 'EMAIL_VERIFICATION'
  | 'PHONE_VERIFICATION'
  | 'PASSWORD_RESET'
  | 'LOGIN'

export interface OtpEntity {
  id:          string
  identifier:  string
  channel:     OtpChannel
  purpose:     OtpPurpose
  codeHash:    string
  expiresAt:   Date
  verifiedAt:  Date | null
  attempts:    number
  maxAttempts: number
  createdAt:   Date
  updatedAt:   Date
}
