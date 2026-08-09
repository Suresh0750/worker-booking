'use client'

import { useEffect, useState,useCallback } from 'react'
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
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Select, Textarea } from '@/components/ui/FormFields'
import { LocationPicker } from '@/components/ui/LocationPicker'
import { PROFESSIONS, SLOT_TYPE_LABELS } from '@/lib/utils'
import { Location } from '@/types'
import { cn } from '@/lib/utils'
import { useApi } from '@/hooks/useApi'
import { getCategories } from '@/lib/services/appService'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { APP_ROLES, RegisterRole } from '@/constants/utils'

type SlotType = 'SLOT_BASED' | 'REQUEST_BASED' | 'HYBRID'

const STEPS = ['Account', 'About you', 'Booking setup']
type IHandleRole = RegisterRole

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuth()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<RegisterRole>(APP_ROLES.CUSTOMER)
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
    // defaultValues: { role: 'USER', rateType: 'HOURLY' },
    mode: 'onTouched',
  })
  
  // const {data:categories=[],isLoading,isError} = useApi(QUERY_KEYS.categories,getCategories, { select: (res) => res.data }) 
  
  const handleRoleChange = useCallback((r: IHandleRole) => {
    setRole(r)
    setValue('role', r)
  }, [setValue])  // setRole from useState is stable, no need to add
  

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    if (data.role === 'WORKER' && !location) {
      toast.error('Please select your location')
      return
    }
    try {
      const payload = { ...data, location }
      const res = await api.auth.register(payload)
      if (!res.success) throw new Error(res.message)
  
      const loginRes = await api.auth.login({ email: data.email, password: data.password })
      tokenStore.set(loginRes.data.accessToken, loginRes.data.refreshToken)
      setUser(loginRes.data)
      toast.success('Account created! Welcome to WorkerHub 🎉')
      router.push(data.role === 'WORKER' ? '/worker/dashboard' : '/client/search')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Registration failed')
    }
  }, [location, setUser, router])  // api, tokenStore, toast are stable module-level refs
 
  // useEffect(()=>{
  //   console.log("categories",categories)
  // },[categories])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo className="h-20 w-20" variant="square" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of workers and clients</p>
        </div>

        <div className="card p-8">
          {/* Role toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-6 p-1 gap-1">
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

          {/* Progress for workers */}
          

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

            
            {/* Actions */}
            <div className="mt-6 flex gap-3">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  {'Create account'}
                </Button>
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
