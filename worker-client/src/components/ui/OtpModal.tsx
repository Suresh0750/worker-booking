'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Mail, Phone, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 30
// How long the success screen is shown before the modal calls onClose automatically
const SUCCESS_LINGER_MS = 1_400

interface OtpModalProps {
  open: boolean
  channel: 'email' | 'phone'
  /** The masked target string shown to the user (e.g. "jo**@example.com") */
  target: string
  title: string
  onClose: () => void
  /** Called with the 6-digit OTP string; should throw on failure */
  onVerify: (otp: string) => Promise<void>
  /** Called when the user asks to resend; should throw on failure */
  onResend: () => Promise<void>
}

type Phase = 'idle' | 'verifying' | 'success' | 'error'

export function OtpModal({
  open,
  channel,
  target,
  title,
  onClose,
  onVerify,
  onResend,
}: OtpModalProps) {
  const [digits, setDigits]     = useState<string[]>(() => Array(OTP_LENGTH).fill(''))
  const [phase, setPhase]       = useState<Phase>('idle')
  const [error, setError]       = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── reset state whenever the modal opens ─────────────────────────────────
  const reset = useCallback(() => {
    setDigits(Array(OTP_LENGTH).fill(''))
    setError(null)
    setPhase('idle')
  }, [])

  useEffect(() => {
    if (open) {
      reset()
      setResendIn(RESEND_COOLDOWN)
      const t = setTimeout(() => inputRefs.current[0]?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      if (successTimer.current) clearTimeout(successTimer.current)
    }
  }, [open, reset])

  // ── resend cooldown ticker ────────────────────────────────────────────────
  useEffect(() => {
    if (!open || resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [open, resendIn])

  // ── submit ────────────────────────────────────────────────────────────────
  const submit = useCallback(
    async (otp: string) => {
      if (otp.length !== OTP_LENGTH || phase === 'verifying' || phase === 'success') return
      setPhase('verifying')
      setError(null)
      try {
        await onVerify(otp)
        setPhase('success')
        // Auto-close after linger
        successTimer.current = setTimeout(() => onClose(), SUCCESS_LINGER_MS)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? err?.message ?? 'Invalid OTP. Please try again.')
        setDigits(Array(OTP_LENGTH).fill(''))
        setPhase('error')
        setTimeout(() => {
          setPhase('idle')
          inputRefs.current[0]?.focus()
        }, 120)
      }
    },
    [phase, onVerify, onClose],
  )

  // Auto-submit once all six digits are filled
  useEffect(() => {
    if (digits.every((d) => d !== '') && phase === 'idle') {
      void submit(digits.join(''))
    }
  }, [digits, phase, submit])

  // ── digit input handlers ──────────────────────────────────────────────────
  const handleChange = useCallback((index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setError(null)
    if (phase === 'error') setPhase('idle')
    setDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }, [phase])

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits],
  )

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    setDigits((prev) => {
      const next = [...prev]
      text.split('').forEach((ch, i) => { next[i] = ch })
      return next
    })
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus()
  }, [])

  // ── resend ────────────────────────────────────────────────────────────────
  const handleResend = useCallback(async () => {
    setResending(true)
    setError(null)
    try {
      await onResend()
      setResendIn(RESEND_COOLDOWN)
      reset()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to resend OTP.')
    } finally {
      setResending(false)
    }
  }, [onResend, reset])

  if (!open || typeof document === 'undefined') return null

  const Icon = channel === 'email' ? Mail : Phone
  const isVerifying = phase === 'verifying'
  const isSuccess   = phase === 'success'
  const isError     = phase === 'error'

  // Masked display target
  const displayTarget = channel === 'email'
    ? target.replace(/(.{2})(.*)(@.*)/, (_, a, _b, c) => `${a}***${c}`)
    : target.replace(/(\+?\d{2,3})(\d{3})(\d+)(\d{2})/, (_, cc, _m, _n, last) => `${cc}*****${last}`)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="otp-modal-title">
      {/* Full-page backdrop — rendered directly in body, unaffected by ancestor stacking contexts */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={isSuccess ? undefined : onClose}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 sm:p-8 animate-fade-up">

        {/* Close button — hidden during success */}
        {!isSuccess && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ── Success state ─────────────────────────────────────────── */}
        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-slate-900">
                {channel === 'email' ? 'Email verified!' : 'Phone verified!'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {channel === 'email'
                  ? 'Your email address has been confirmed.'
                  : 'Your phone number has been confirmed.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-3">
                <Icon className="w-6 h-6" />
              </div>
              <h3 id="otp-modal-title" className="font-display text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {channel === 'email'
                  ? <>We emailed a 6-digit code to <span className="font-medium text-slate-700">{displayTarget}</span></>
                  : <>We texted a 6-digit code to <span className="font-medium text-slate-700">{displayTarget}</span></>
                }
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Check your {channel === 'email' ? 'inbox (and spam folder)' : 'SMS messages'}.
              </p>
            </div>

            {/* ── Digit inputs ──────────────────────────────────────── */}
            <div className="flex justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={2}
                  value={digit}
                  disabled={isVerifying}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${i + 1}`}
                  className={cn(
                    'w-11 h-12 sm:w-12 text-center text-lg font-semibold rounded-xl border transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isError
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : digit
                        ? 'border-brand-400 bg-white text-slate-900'
                        : 'border-slate-200 bg-white text-slate-900',
                  )}
                />
              ))}
            </div>

            {/* ── Status messages ───────────────────────────────────── */}
            <div className="min-h-[1.5rem] mt-3 text-center">
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              {isVerifying && !error && (
                <p className="text-xs text-slate-400">Verifying your code…</p>
              )}
            </div>

            {/* ── Footer actions ────────────────────────────────────── */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resendIn > 0 || isVerifying || resending}
              >
                <RotateCcw className={cn('w-3.5 h-3.5', resending && 'animate-spin')} />
                {resending ? 'Sending…' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                disabled={isVerifying}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
