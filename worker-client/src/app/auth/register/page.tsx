'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, IndianRupee } from 'lucide-react'
import { registerSchema, RegisterFormData } from '@/lib/validations'
import { api, tokenStore } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/FormFields'
import { LocationPicker } from '@/components/ui/LocationPicker'
import { PROFESSIONS, SLOT_TYPE_LABELS } from '@/lib/utils'
import { Location } from '@/types'
import { cn } from '@/lib/utils'

type SlotType = 'SLOT_BASED' | 'REQUEST_BASED' | 'HYBRID'

const STEPS = ['Account', 'About you', 'Booking setup']

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'USER' | 'WORKER'>('USER')
  const [showPassword, setShowPassword] = useState(false)
  const [location, setLocation] = useState<Location | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'USER', rateType: 'HOURLY' },
    mode: 'onTouched',
  })

  const selectedSlotType = watch('slotType')
  const selectedRateType = watch('rateType') ?? 'HOURLY'
  const maxSteps = role === 'WORKER' ? 3 : 1

  const handleRoleChange = (r: 'USER' | 'WORKER') => {
    setRole(r)
    setValue('role', r)
  }

  const handleNext = async () => {
    let fields: (keyof RegisterFormData)[] = []
    if (step === 0) fields = ['name', 'email', 'password', 'confirmPassword']
    if (step === 1) fields = ['profession', 'rateType', 'rate', 'bio']
    const ok = await trigger(fields)
    if (ok) setStep(s => s + 1)
  }

  const onSubmit = async (data: RegisterFormData) => {
    if (data.role === 'WORKER' && !location) {
      toast.error('Please select your location')
      return
    }
    try {
      const payload = { ...data, location }
      const res = await api.auth.register(payload)
      if (!res.success) throw new Error(res.message)

      // Auto-login after register
      const loginRes = await api.auth.login({ email: data.email, password: data.password })
      tokenStore.set(loginRes.data.accessToken, loginRes.data.refreshToken)
      setUser(loginRes.data)
      toast.success('Account created! Welcome to WorkerHub 🎉')
      router.push(data.role === 'WORKER' ? '/worker/dashboard' : '/client/search')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of workers and clients</p>
        </div>

        <div className="card p-8">
          {/* Role toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6 p-1 gap-1">
            {(['USER', 'WORKER'] as const).map((r) => (
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
                {r === 'USER' ? '👤 I need a worker' : '🔧 I am a worker'}
              </button>
            ))}
          </div>

          {/* Progress for workers */}
          {role === 'WORKER' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                      i < step ? 'bg-brand-600 text-white' :
                      i === step ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300' :
                      'bg-slate-100 text-slate-400'
                    )}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-brand-700' : 'text-slate-400')}>
                      {s}
                    </span>
                    {i < STEPS.length - 1 && (
                      <div className={cn('h-px w-8 sm:w-12 mx-1', i < step ? 'bg-brand-400' : 'bg-slate-200')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ── STEP 0: Account ── */}
            {step === 0 && (
              <div className="space-y-4 animate-fade-up">
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  autoComplete="name"
                  error={errors.name?.message}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                  {...register('name')}
                />
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={errors.email?.message}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                  {...register('email')}
                />
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, upper, lower, number"
                  autoComplete="new-password"
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
              </div>
            )}

            {/* ── STEP 1: Worker details ── */}
            {step === 1 && role === 'WORKER' && (
              <div className="space-y-4 animate-fade-up">
                <Select
                  label="Profession"
                  placeholder="Select your profession"
                  options={PROFESSIONS.map(p => ({ value: p, label: p }))}
                  error={errors.profession?.message}
                  required
                  {...register('profession')}
                />

                {/* ── Rate type toggle + input ── */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your rate <span className="text-red-500">*</span>
                  </label>

                  {/* Hourly / Daily toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-3 p-1 gap-1">
                    {(['HOURLY', 'DAILY'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('rateType', type, { shouldValidate: true })}
                        className={cn(
                          'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                          selectedRateType === type
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {type === 'HOURLY' ? '⏱ Per hour' : '📅 Per day'}
                      </button>
                    ))}
                  </div>

                  {/* Rate context info */}
                  <div className={cn(
                    'text-xs px-3 py-2 rounded-lg mb-3 font-medium',
                    selectedRateType === 'DAILY'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-brand-50 text-brand-700'
                  )}>
                    {selectedRateType === 'DAILY'
                      ? 'Daily rate: full day of work (6–8 hrs). Clients see ₹X/day on your profile.'
                      : 'Hourly rate: billed per hour worked. Clients see ₹X/hr on your profile.'}
                  </div>

                  {/* Rate input */}
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="number"
                      min={1}
                      placeholder={selectedRateType === 'DAILY' ? 'e.g. 3000' : 'e.g. 500'}
                      className={cn(
                        'input-base pl-10 pr-16',
                        errors.rate && 'input-error'
                      )}
                      {...register('rate')}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                      {selectedRateType === 'DAILY' ? '/ day' : '/ hr'}
                    </span>
                  </div>
                  {errors.rate && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      {errors.rate.message}
                    </p>
                  )}
                  {errors.rateType && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.rateType.message}</p>
                  )}
                </div>

                <Textarea
                  label="Bio (optional)"
                  placeholder="Tell clients about your experience, specialties..."
                  rows={3}
                  error={errors.bio?.message}
                  hint="Max 300 characters"
                  {...register('bio')}
                />
              </div>
            )}

            {/* ── STEP 2: Booking setup + location ── */}
            {step === 2 && role === 'WORKER' && (
              <div className="space-y-5 animate-fade-up">
                {/* Slot type picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How do you want to receive bookings? <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {(Object.entries(SLOT_TYPE_LABELS) as [SlotType, typeof SLOT_TYPE_LABELS[string]][]).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue('slotType', key, { shouldValidate: true })}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border-2 transition-all duration-150',
                          selectedSlotType === key
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{info.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{info.desc}</p>
                            <p className="text-xs text-brand-600 mt-1 font-medium">{info.example}</p>
                          </div>
                          <div className={cn(
                            'w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center',
                            selectedSlotType === key ? 'border-brand-500 bg-brand-500' : 'border-slate-300'
                          )}>
                            {selectedSlotType === key && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.slotType && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.slotType.message}</p>
                  )}
                </div>

                {/* Location picker */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your work area <span className="text-red-500">*</span>
                  </label>
                  <LocationPicker
                    onSelect={(loc) => {
                      setLocation(loc)
                      setValue('location', loc, { shouldValidate: true })
                    }}
                  />
                  {errors.location && (
                    <p className="mt-1.5 text-xs text-red-500">Location is required</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {role === 'WORKER' && step < 2 ? (
                <Button type="button" onClick={handleNext} className="flex-1">
                  Continue
                </Button>
              ) : (
                <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  {role === 'USER' ? 'Create account' : 'Finish setup'}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
