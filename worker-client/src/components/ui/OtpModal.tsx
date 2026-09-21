'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mail, Phone, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30

interface OtpModalProps {
  open: boolean
  channel: 'email' | 'phone'
  target: string
  title: string
  onClose: () => void
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
}

export function OtpModal({
  open,
  channel,
  target,
  title,
  onClose,
  onVerify,
  onResend,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const reset = useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(''))
    setError(null)
    setIsVerifying(false)
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      setResendIn(RESEND_COOLDOWN)
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open, reset])

  useEffect(() => {
    if (!open || resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [open, resendIn])

  const submit = useCallback(
    async (otp: string) => {
      if (otp.length !== OTP_LENGTH || isVerifying) return
      setIsVerifying(true)
      setError(null)
      try {
        await onVerify(otp)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Invalid OTP. Please try again')
        setDigits(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
      } finally {
        setIsVerifying(false)
      }
    },
    [isVerifying, onVerify]
  )

  // Auto-submit once all six digits are entered
  useEffect(() => {
    if (digits.every((d) => d !== '') && !isVerifying) {
      void submit(digits.join(''))
    }
  }, [digits, isVerifying, submit])

  const handleChange = useCallback((index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setError(null)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [])

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits]
  )

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    setDigits((prev) => {
      const next = [...prev]
      text.split('').forEach((ch, i) => {
        next[i] = ch
      })
      return next
    })
    inputRefs.current[text.length - 1]?.focus()
  }, [])

  const handleResend = useCallback(async () => {
    setError(null)
    try {
      await onResend()
      setResendIn(RESEND_COOLDOWN)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to resend OTP')
    }
  }, [onResend])

  if (!open) return null

  const Icon = channel === 'email' ? Mail : Phone

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-modal p-6 sm:p-8 animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-1">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-slate-700">{target}</span>
          </p>
        </div>

        <div className="flex justify-center gap-2 sm:gap-2.5">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={2}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={cn(
                'w-11 h-12 sm:w-12 text-center text-lg font-semibold text-slate-900 rounded-xl border',
                'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all',
                error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
                digit && !error && 'border-brand-400'
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs text-red-500 mt-3">{error}</p>
        )}
        {isVerifying && (
          <p className="text-center text-xs text-slate-400 mt-3">Verifying...</p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleResend} disabled={resendIn > 0}>
            <RotateCcw className="w-3.5 h-3.5" />
            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
