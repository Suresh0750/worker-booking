'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Loader2, Save, User, Phone, Calendar, Camera, BadgeCheck, Briefcase,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, Textarea } from '@/components/ui/FormFields'

// ─── Validation helpers (same rules as RegisterForm) ─────────────────────────

// Accepts: 10-digit starting with any digit (dev), or E.164 (+91XXXXXXXXXX)
const PHONE_REGEX = /^\d{10}$|^\+?[1-9]\d{9,14}$/

function phoneRule(label: string) {
  return z
    .string()
    .trim()
    .regex(PHONE_REGEX, `Enter a valid 10-digit ${label}`)
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  // ── User table ──────────────────────────────────────────
  fullName: z
    .string()
    .trim()
    .min(2,  'Name must be at least 2 characters')
    .max(100, 'Name is too long'),

  phone: phoneRule('phone number'),

  // Optional — but if something is entered it must be a valid phone number
  secondaryPhone: z
    .string()
    .trim()
    .optional()
    .refine(
      v => !v || PHONE_REGEX.test(v),
      'Enter a valid 10-digit secondary phone number',
    ),

  // Optional — if selected must be a known value
  gender: z
    .enum(['MALE', 'FEMALE', 'OTHER', ''])
    .optional()
    .transform(v => (v === '' ? undefined : v)),

  // Optional — if entered must be a past date
  dob: z
    .string()
    .optional()
    .refine(v => {
      if (!v) return true           // empty is fine
      const d = new Date(v)
      if (isNaN(d.getTime())) return false   // not a real date
      return d < new Date()         // must be in the past
    }, 'Date of birth must be a past date'),

  // ── Worker table ─────────────────────────────────────────
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be under 500 characters')
    .optional(),

  experienceYears: z.coerce
    .number({ invalid_type_error: 'Enter a valid number' })
    .int('Must be a whole number')
    .min(0,  'Cannot be negative')
    .max(60, 'Maximum 60 years'),
})

type FormData = z.infer<typeof schema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyProfilePage() {
  const { user, isLoading: authLoading, patchUser } = useAuth()

  const [pageLoading,   setPageLoading]   = useState(true)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  // ── Seed form ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return

    // If context has full worker data (bio + experienceYears present), seed immediately
    // bio can be null/empty but experienceYears should be a number if worker data was loaded
    const hasWorkerData = user?.fullName && typeof user?.experienceYears === 'number'

    if (hasWorkerData) {
      setAvatarPreview(user!.profileImage ?? null)
      reset({
        fullName:        user!.fullName,
        phone:           user!.phone,
        secondaryPhone:  user!.secondaryPhone ?? '',
        gender:          (user!.gender as any) ?? '',
        dob:             user!.dob ? user!.dob.slice(0, 10) : '',
        bio:             user!.bio ?? '',
        experienceYears: user!.experienceYears ?? 0,
      })
      setPageLoading(false)
      return
    }

    // ⬇️ Fallback: worker fields missing from context (old session / stale cache)
    // Fetch GET /workers/me to get the complete profile including bio + experienceYears
    api.worker.getFullProfile()
      .then(res => {
        const p = res.data
        setAvatarPreview(p.profileImage ?? null)
        reset({
          fullName:        p.fullName,
          phone:           p.phone,
          secondaryPhone:  p.secondaryPhone ?? '',
          gender:          (p.gender as any) ?? '',
          dob:             p.dob ? p.dob.slice(0, 10) : '',
          bio:             p.bio ?? '',
          experienceYears: p.experienceYears ?? 0,
        })
        // Hydrate context so future visits skip the API call
        patchUser({
          fullName:        p.fullName,
          phone:           p.phone,
          profileImage:    p.profileImage ?? null,
          bio:             p.bio ?? null,
          experienceYears: p.experienceYears,
          isVerified:      p.isVerified,
          availability:    p.availability,
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setPageLoading(false))
  }, [authLoading, user?.experienceYears, user?.fullName, reset, patchUser])

  // ── Avatar upload ───────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    // Optimistic local preview
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)
    setUploading(true)
    try {
      const res = await api.worker.uploadProfileImage(file)
      // Backend returns { profileImage: url } via PATCH /users/me/avatar
      const newUrl = (res.data as any).profileImage ?? (res.data as any).url
      setAvatarPreview(newUrl)
      patchUser({ profileImage: newUrl })
      toast.success('Profile photo updated!')
    } catch (err: any) {
      setAvatarPreview(user?.profileImage ?? null)
      toast.error(err?.response?.data?.message ?? 'Failed to upload photo')
    } finally {
      setUploading(false)
      // Reset file input so same file can be re-selected
      e.target.value = ''
    }
  }

  // ── Save — two parallel PATCH calls for two separate tables ────────────────
  const onSubmit = async (data: FormData) => {
    try {
      const workerRes  = await api.worker.updateUserFields({
          fullName: data.fullName,
          phone:    data.phone,
          ...(data.secondaryPhone !== undefined
            ? { secondaryPhone: data.secondaryPhone || '' }
            : {}),
          ...(data.gender ? { gender: data.gender } : {}),
          ...(data.dob   ? { dob:    data.dob   }   : {}),
           ...(data.bio             !== undefined ? { bio:             data.bio             } : {}),
          ...(data.experienceYears !== undefined ? { experienceYears: Number(data.experienceYears) } : {}),
        })

      // Keep context in sync — sidebar name updates instantly
      patchUser({
        fullName:        data.fullName,
        phone:           data.phone,
        secondaryPhone:  data.secondaryPhone || null,
        gender:          data.gender         || null,
        dob:             data.dob            || null,
        bio:             data.bio            ?? null,
        experienceYears: Number(data.experienceYears),
        availability:    (workerRes?.data as any)?.availability ?? user?.availability,
        isVerified:      (workerRes?.data as any)?.isVerified    ?? user?.isVerified,
      })

      toast.success('Profile saved!')
      reset(data)   // clears isDirty so Save button disables again
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed')
    }
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">My Profile</h1>
        <p className="text-sm text-slate-500">Edit your personal details and professional info</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 mb-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={ avatarPreview}
                alt="Profile photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-brand-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md hover:bg-brand-700 transition-colors disabled:opacity-60"
            aria-label="Change photo"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{user?.fullName}</p>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {user?.isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                Pending verification
              </span>
            )}
            {user?.workerId && (
              <span className="text-xs text-slate-400 font-mono">
                ID: {user.workerId.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

        {/* Personal information — updates /users/me */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" /> Personal information
          </h2>

          <Input
            label="Full name"
            error={errors.fullName?.message}
            leftIcon={<User className="w-4 h-4" />}
            required
            {...register('fullName')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
               maxLength={10}
              placeholder="10-digit mobile number"
              error={errors.phone?.message}
              leftIcon={<Phone className="w-4 h-4" />}
              required
              {...register('phone')}
            />
            <Input
              label="Secondary phone"
              type="tel"
              error={errors.secondaryPhone?.message}
              leftIcon={<Phone className="w-4 h-4" />}
              autoComplete="tel"
               maxLength={10}
              hint="Optional"
              {...register('secondaryPhone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              options={[
                { value: '',       label: 'Prefer not to say' },
                { value: 'MALE',   label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER',  label: 'Other' },
              ]}
              error={errors.gender?.message}
              {...register('gender')}
            />
            <Input
              label="Date of birth"
              type="date"
              error={errors.dob?.message}
              leftIcon={<Calendar className="w-4 h-4" />}
              {...register('dob')}
            />
          </div>
        </div>

        {/* Professional information — updates /workers/me */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-600" /> Professional information
          </h2>

          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={60}
            error={errors.experienceYears?.message}
            hint="How many years have you been doing this work?"
            required
            {...register('experienceYears')}
          />

          <Textarea
            label="Bio"
            placeholder="Tell clients about your experience, what makes you great, and the kind of work you love doing..."
            rows={4}
            error={errors.bio?.message}
            hint="Max 500 characters — shown on your public profile"
            {...register('bio')}
          />
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isDirty}
          className="w-full"
          size="lg"
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save changes
        </Button>
      </form>
    </main>
  )
}
