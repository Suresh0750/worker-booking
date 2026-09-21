'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Loader2, Save, User, Phone, Calendar, Camera,
  BadgeCheck, Briefcase,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, Textarea } from '@/components/ui/FormFields'
import { WorkerFullProfile } from '@/types'
import { cn } from '@/lib/utils'

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  secondaryPhone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', '']).optional(),
  dob: z.string().optional(),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional(),
  experienceYears: z.coerce.number().min(0).max(60),
})
type FormData = z.infer<typeof schema>

export default function MyProfilePage() {
  const [profile, setProfile] = useState<WorkerFullProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    api.worker.getFullProfile()
      .then(res => {
        const p = res.data
        setProfile(p)
        setAvatarPreview(p.profileImage ?? null)
        reset({
          fullName: p.fullName,
          phone: p.phone,
          secondaryPhone: p.secondaryPhone ?? '',
          gender: (p.gender as any) ?? '',
          dob: p.dob ? p.dob.slice(0, 10) : '',
          bio: p.bio ?? '',
          experienceYears: p.experienceYears,
        })
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [reset])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const res = await api.worker.uploadProfileImage(file)
      toast.success('Profile photo updated!')
      setAvatarPreview(res.data.url)
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      await api.worker.updateFullProfile({
        ...data,
        gender: data.gender || undefined,
        dob: data.dob || undefined,
      })
      toast.success('Profile saved!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">My Profile</h1>
        <p className="text-sm text-slate-500">Edit your personal details and professional info</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 mb-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-brand-100 overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-brand-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md hover:bg-brand-700 transition-colors"
            aria-label="Change photo"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{profile?.fullName}</p>
          <p className="text-sm text-slate-500 mt-0.5">{profile?.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {profile?.isVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                Pending verification
              </span>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Personal info */}
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
              {...register('secondaryPhone')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              options={[
                { value: '', label: 'Prefer not to say' },
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
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

        {/* Professional info */}
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
            hint="Max 300 characters — shown on your public profile"
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
