'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, Sparkles,
  User, Phone, CheckCircle2,
} from 'lucide-react'
import { loginSchema, LoginFormData, registerSchema, RegisterFormData } from '@/lib/validations'
import { api, tokenStore, toE164 } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { OtpModal } from '@/components/ui/OtpModal'
import { cn } from '@/lib/utils'
import { APP_ROLES, RegisterRole } from '@/constants/utils'

// ─── constants ────────────────────────────────────────────────────────────────
type Tab = 'login' | 'register'
type OtpChannel = 'email' | 'phone'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[6-9]\d{9}$/


function RegisterForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter()
  const { setUser } = useAuth()
  const [role, setRole] = useState<RegisterRole>(APP_ROLES.CUSTOMER)
  const [showPassword, setShowPassword] = useState(false)
  const [verified, setVerified] = useState({ email: false, phone: false })
  const [otpSending, setOtpSending] = useState({ email: false, phone: false })
  const [otpModal, setOtpModal] = useState<{ channel: OtpChannel; target: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    shouldFocusError: true,
    mode: 'onTouched',
  })

  const emailValue = watch('email') ?? ''
  const phoneValue = watch('phone') ?? ''
  const emailValid = EMAIL_REGEX.test(emailValue)
  const phoneValid = PHONE_REGEX.test(phoneValue)

  // Reset verification when values change
  useEffect(() => { setVerified((v) => ({ ...v, email: false })) }, [emailValue])
  useEffect(() => { setVerified((v) => ({ ...v, phone: false })) }, [phoneValue])

  // Set initial role
  useEffect(() => { setValue('role', APP_ROLES.CUSTOMER) }, [setValue])

  const handleRoleChange = useCallback(
    (r: RegisterRole) => { setRole(r); setValue('role', r) },
    [setValue]
  )

  const handleSendOtp = useCallback(
    async (channel: OtpChannel) => {
      if (otpSending[channel]) return
      setOtpSending((s) => ({ ...s, [channel]: true }))
      try {
        const body: { email?: string; phone?: string } = channel === 'email'
          ? { email: emailValue }
          : { phone: phoneValue }
        const res = await api.auth.sendOtp(body)
        // Store normalised target so verifyOtp sends the same identifier the backend stored
        const target = channel === 'email' ? emailValue : toE164(phoneValue)
        setOtpModal({ channel, target })
        if (res.data?.debugCode) {
          toast.success(`OTP sent! Dev code: ${res.data.debugCode}`)
        } else {
          toast.success(channel === 'email' ? 'OTP sent to your email' : 'OTP sent to your phone')
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP')
      } finally {
        setOtpSending((s) => ({ ...s, [channel]: false }))
      }
    },
    [emailValue, phoneValue, otpSending]
  )

  const handleResendOtp = useCallback(async () => {
    if (!otpModal) return
    const body: { email?: string; phone?: string } = otpModal.channel === 'email'
      ? { email: otpModal.target }
      : { phone: otpModal.target }
    const res = await api.auth.sendOtp(body)
    if (!res.success) throw new Error(res.message)
  }, [otpModal])

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      if (!otpModal) return
      const { channel, target } = otpModal
      const body = channel === 'email' ? { email: target, otp } : { phone: target, otp }
      const res = await api.auth.verifyOtp(body)
      if (!res.success) throw new Error(res.message)
      setVerified((v) => ({ ...v, [channel]: true }))
      setOtpModal(null)
      setValue(channel === 'email' ? 'isVerifyEmail' : 'isVerifyPhone', true)
      toast.success(channel === 'email' ? 'Email verified ✓' : 'Phone verified ✓')
    },
    [otpModal, setValue]
  )

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      if (!verified.email) { toast.error('Please verify your email address first'); return }
      if (!verified.phone) { toast.error('Please verify your phone number first'); return }
      try {
        const res = await api.auth.register(data)
        if (!res.success) throw new Error(res.message)
        const loginRes = await api.auth.login({ email: data.email, password: data.password })
        tokenStore.set(loginRes.data.accessToken, loginRes.data.refreshToken)
        setUser(loginRes.data)
        toast.success('Account created! Welcome to WorkerHub 🎉')
        router.push(data.role === 'WORKER' ? '/worker/dashboard' : '/client/search')
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? err.message ?? 'Registration failed')
      }
    },
    [verified, setUser, router]
  )

  return (
    <div className="animate-fade-up space-y-6">
      {/* Heading */}
      <div>
        <p className="text-brand-600 text-sm font-semibold mb-1">Get started</p>
        <h2 className="font-display text-3xl font-bold text-slate-900 leading-tight">
          Create your account
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          Join thousands of workers and clients on WorkerHub.
        </p>
      </div>

      {/* Role toggle */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 p-1 gap-1">
        {([APP_ROLES.CUSTOMER, APP_ROLES.WORKER] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleRoleChange(r)}
            className={cn(
              'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
              role === r
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            {r === APP_ROLES.CUSTOMER ? '👤 I need a worker' : '🔧 I am a worker'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Full name"
          placeholder="John Doe"
          autoComplete="name"
          error={errors.fullName?.message}
          leftIcon={<User className="w-4 h-4" />}
          required
          {...register('fullName')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4" />}
          rightIcon={
            verified.email ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            ) : emailValid ? (
              <button
                type="button"
                onClick={() => handleSendOtp('email')}
                disabled={otpSending.email}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap disabled:opacity-60"
              >
                {otpSending.email ? 'Sending…' : 'Verify'}
              </button>
            ) : undefined
          }
          required
          {...register('email')}
        />

        <Input
          label="Phone"
          type="tel"
          placeholder="10-digit mobile number"
          autoComplete="tel"
          maxLength={10}
          error={errors.phone?.message}
          leftIcon={<Phone className="w-4 h-4" />}
          rightIcon={
            verified.phone ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            ) : phoneValid ? (
              <button
                type="button"
                onClick={() => handleSendOtp('phone')}
                disabled={otpSending.phone}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap disabled:opacity-60"
              >
                {otpSending.phone ? 'Sending…' : 'Verify'}
              </button>
            ) : undefined
          }
          required
          {...register('phone')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Min 8 chars, upper, lower, number"
          autoComplete="new-password"
          maxLength={72}
          error={errors.password?.message}
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
          {...register('password')}
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="w-4 h-4" />}
          required
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
          Create account
        </Button>
      </form>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
        <ShieldCheck className="w-4 h-4 text-brand-500" />
        Your information is safe and secure
      </div>

      {/* Switch to login */}
      <div className="pt-5 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchTab}
            className="text-brand-600 font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* OTP Modal lives here so it's scoped to this form's state */}
      <OtpModal
        open={otpModal !== null}
        channel={otpModal?.channel ?? 'email'}
        target={otpModal?.target ?? ''}
        title={otpModal?.channel === 'email' ? 'Verify your email' : 'Verify your phone'}
        onClose={() => setOtpModal(null)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    </div>
  )
}

export default RegisterForm;