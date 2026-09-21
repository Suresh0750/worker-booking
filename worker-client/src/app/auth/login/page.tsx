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

// ─── Login sub-form ───────────────────────────────────────────────────────────
function LoginForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const router = useRouter()
  const { setUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  // Post-login OTP verification state
  const [loggedInUser, setLoggedInUser]   = useState<{ email: string } | null>(null)
  const [verifyModal, setVerifyModal]     = useState<{ channel: OtpChannel; target: string } | null>(null)
  const [otpSending, setOtpSending]       = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await api.auth.login(data)
      if (!res.success) throw new Error(res.message)
      tokenStore.set(res.data.accessToken, res.data.refreshToken)
      setUser(res.data)
      toast.success('Welcome back!')
      // Store email so the post-login verification banner can use it
      setLoggedInUser({ email: data.email })
      // Don't redirect yet — let the user optionally verify their contact
      // They can skip by clicking "Continue" or the OTP modal will auto-close
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Login failed')
    }
  }

  const redirectAfterLogin = useCallback(() => {
    const user = tokenStore.getUser()
    router.push(user?.role === 'WORKER' ? '/worker/dashboard' : '/client/search')
  }, [router])

  // Triggered when user clicks "Verify email" or "Verify phone" after login
  const handleSendLoginOtp = async (channel: OtpChannel) => {
    if (!loggedInUser || otpSending) return
    setOtpSending(true)
    try {
      const body = channel === 'email' ? { email: loggedInUser.email } : undefined
      // phone not stored in LoginFormData — for email we use the logged-in email
      if (!body) return
      const res = await api.auth.sendLoginOtp(body)
      setVerifyModal({ channel, target: loggedInUser.email })
      if (res.data?.debugCode) toast.success(`OTP sent! Dev code: ${res.data.debugCode}`)
      else toast.success('OTP sent to your email')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyLoginOtp = async (otp: string) => {
    if (!verifyModal) return
    const body = verifyModal.channel === 'email'
      ? { email: verifyModal.target, otp }
      : { phone: verifyModal.target, otp }
    const res = await api.auth.verifyLoginOtp(body)
    if (!res.success) throw new Error(res.message)
    setVerifyModal(null)
    setLoggedInUser(null)
    toast.success('Contact verified ✓')
    redirectAfterLogin()
  }

  const handleResendLoginOtp = async () => {
    if (!verifyModal) return
    const body = verifyModal.channel === 'email' ? { email: verifyModal.target } : { phone: verifyModal.target }
    const res = await api.auth.sendLoginOtp(body)
    if (!res.success) throw new Error(res.message)
  }

  return (
    <div className="animate-fade-up space-y-6">
      {/* Heading */}
      <div>
        <p className="text-brand-600 text-sm font-semibold mb-1">Welcome back</p>
        <h2 className="font-display text-3xl font-bold text-slate-900 leading-tight">
          Sign in to your account
        </h2>
        <p className="text-slate-500 text-sm mt-2">
          Book trusted workers or manage your next job.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4 h-4" />}
          {...register('email')}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <button
              type="button"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="w-full"
          size="lg"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign in
        </Button>
      </form>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
        <ShieldCheck className="w-4 h-4 text-brand-500" />
        Your information is safe and secure
      </div>

      {/* Post-login verification prompt — shown right after a successful login */}
      {loggedInUser && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 space-y-3">
          <p className="text-sm font-medium text-brand-800">
            One more step — verify your contact info
          </p>
          <p className="text-xs text-brand-600">
            Verify your email address to keep your account secure.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              isLoading={otpSending}
              onClick={() => handleSendLoginOtp('email')}
              className="flex-1"
            >
              <Mail className="w-3.5 h-3.5" />
              Verify email
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={redirectAfterLogin}
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {/* Switch to register */}
      <div className="pt-5 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={onSwitchTab}
            className="text-brand-600 font-semibold hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
      <OtpModal
        open={verifyModal !== null}
        channel={verifyModal?.channel ?? 'email'}
        target={verifyModal?.target ?? ''}
        title={verifyModal?.channel === 'email' ? 'Verify your email' : 'Verify your phone'}
        onClose={() => setVerifyModal(null)}
        onVerify={handleVerifyLoginOtp}
        onResend={handleResendLoginOtp}
      />
    </div>
  )
}

// ─── Register sub-form ────────────────────────────────────────────────────────
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

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function AuthPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo variant="square" className="h-10 w-10 rounded-xl" />
          <span className="text-white font-display font-semibold text-xl tracking-tight">WorkerHub</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <p className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Work made simple
          </p>
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Find the right help.<br />Get more done.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            One trusted place for people who need a hand and skilled workers ready to help.
          </p>

          {/* Illustration */}
          <div className="rounded-2xl overflow-hidden mt-4 max-w-sm">
            <img
              src="/login-illustration.svg"
              alt="Workers illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="relative z-10" />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f9fafb] overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <Logo variant="square" className="h-10 w-10 rounded-xl" />
            <span className="font-display font-semibold text-xl text-slate-900">WorkerHub</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Sign up
            </button>
          </div>

          {/* Active form */}
          {tab === 'login' ? (
            <LoginForm onSwitchTab={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitchTab={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
