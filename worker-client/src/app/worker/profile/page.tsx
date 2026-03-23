'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Loader2, Save, User, IndianRupee, Tag } from 'lucide-react'
import { profileEditSchema, ProfileEditFormData } from '@/lib/validations'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, Textarea } from '@/components/ui/FormFields'
import { LocationPicker } from '@/components/ui/LocationPicker'
import { PROFESSIONS } from '@/lib/utils'
import { Location, WorkerProfile } from '@/types'

export default function ProfileEditPage() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
  })

  const isAvailable = watch('isAvailable')

  useEffect(() => {
    api.worker.getProfile().then(res => {
      const p = res.data
      setProfile(p)
      setLocation(p.location)
      reset({
        name: p.name,
        bio: p.bio ?? '',
        profession: p.profession,
        hourlyRate: p.hourlyRate,
        skills: p.skills.join(', '),
        isAvailable: p.isAvailable,
      })
      setIsLoading(false)
    })
  }, [reset])

  const onSubmit = async (data: ProfileEditFormData) => {
    try {
      const skills = data.skills.split(',').map(s => s.trim()).filter(Boolean)
      await api.worker.updateProfile({ ...data, skills, location })
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed')
    }
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Edit Profile</h1>
          <p className="text-sm text-slate-500">Keep your profile up-to-date to attract more clients</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Basic info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-brand-600" /> Basic information
            </h2>

            <Input
              label="Full name"
              error={errors.name?.message}
              leftIcon={<User className="w-4 h-4" />}
              required
              {...register('name')}
            />

            <Select
              label="Profession"
              options={PROFESSIONS.map(p => ({ value: p, label: p }))}
              error={errors.profession?.message}
              required
              {...register('profession')}
            />

            <Input
              label="Hourly rate (₹)"
              type="number"
              error={errors.hourlyRate?.message}
              leftIcon={<IndianRupee className="w-4 h-4" />}
              required
              {...register('hourlyRate')}
            />

            <Textarea
              label="Bio"
              placeholder="Tell clients about your experience and what makes you great..."
              rows={4}
              error={errors.bio?.message}
              hint="Max 300 characters"
              {...register('bio')}
            />
          </div>

          {/* Skills */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4 text-brand-600" /> Skills
            </h2>
            <Input
              label="Skills (comma separated)"
              placeholder="e.g. Furniture making, Wood polishing, Cabinet installation"
              error={errors.skills?.message}
              hint="Add your key skills so clients can find you"
              {...register('skills')}
            />
            {/* Preview */}
            {watch('skills') && (
              <div className="flex flex-wrap gap-2">
                {watch('skills').split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium border border-brand-200">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Availability toggle */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Availability</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {isAvailable
                    ? 'You are visible to clients and accepting bookings'
                    : 'You are hidden from search and not accepting bookings'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValue('isAvailable', !isAvailable, { shouldDirty: true })}
                className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                  isAvailable ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-3">Work area</h2>
            <p className="text-sm text-slate-500 mb-4">
              Clients search workers by location. Keep this accurate.
            </p>
            <LocationPicker
              defaultLocation={profile?.location}
              onSelect={setLocation}
            />
          </div>

          {/* Save */}
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!isDirty && location === profile?.location}
            className="w-full"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save changes
          </Button>
        </form>
      </main>
    </>
  )
}
