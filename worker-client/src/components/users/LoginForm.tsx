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

      // 1. Store access token
      tokenStore.setAccess(res.data.accessToken)

      
      // 3. Build the AuthUser object from the full login response
      const loginUser = res.data.user as any
      const authUser = {
        ...loginUser,
        accessToken: res.data.accessToken,
      }

      // 4. Write the role cookie so middleware can read it for redirects
      tokenStore.setRole(loginUser.role)

      // 5. Store in context (splits out addresses automatically)
      setUser(authUser)

      toast.success('Welcome back!')
      setLoggedInUser({ email: data.email })
      router.push(loginUser.role === 'WORKER' ? '/worker/dashboard' : '/client/search')
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

export default LoginForm;