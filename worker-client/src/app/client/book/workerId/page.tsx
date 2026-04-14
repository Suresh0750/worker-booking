'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Clock, IndianRupee } from 'lucide-react'
import { bookingSchema, BookingFormData } from '@/lib/validations'
import { api } from '@/lib/api'
import { WorkerProfile } from '@/types'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/FormFields'
import { LocationPicker } from '@/components/ui/LocationPicker'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Location } from '@/types'

export default function BookingPage() {
  const { workerId } = useParams<{ workerId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slotId = searchParams.get('slotId')

  const [worker, setWorker] = useState<WorkerProfile | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { slotId: slotId ?? undefined },
  })

  useEffect(() => {
    api.workers.getById(workerId).then(res => {
      setWorker(res.data)
      setIsLoading(false)
    })
  }, [workerId])

  const onSubmit = async (data: BookingFormData) => {
    if (!location) { toast.error('Please select your location'); return }
    try {
      await api.bookings.create({ ...data, workerId, location })
      toast.success('Booking created!')
      router.push('/client/bookings')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Booking failed')
    }
  }

  if (isLoading || !worker) {
    return (
      <>
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
          <div className="card p-6 h-64" />
        </div>
      </>
    )
  }

  const isRequestBased = worker.slotType === 'REQUEST_BASED'

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">
          {isRequestBased ? 'Send a job request' : 'Book a slot'}
        </h1>
        <p className="text-slate-500 text-sm mb-6">with {worker.name} · {worker.profession}</p>

        {/* Worker summary */}
        <div className="card p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {worker.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{worker.name}</p>
            <p className="text-xs text-slate-500">{worker.location.city}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-0.5 justify-end">
              <IndianRupee className="w-3.5 h-3.5" />{worker.hourlyRate}
            </p>
            <p className="text-xs text-slate-400">/hour</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Slot display (if pre-selected) */}
          {slotId && (
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-200 flex items-center gap-3">
              <Clock className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-brand-800">Selected slot</p>
                <p className="text-xs text-brand-600 mt-0.5">Slot ID: {slotId}</p>
              </div>
            </div>
          )}

          {/* Preferred date/time — for request-based or no slot selected */}
          {!slotId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Preferred date & time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className={`input-base ${errors.scheduledAt ? 'input-error' : ''}`}
                min={new Date().toISOString().slice(0, 16)}
                {...register('scheduledAt')}
              />
              {errors.scheduledAt && (
                <p className="mt-1.5 text-xs text-red-500">{errors.scheduledAt.message}</p>
              )}
            </div>
          )}

          {/* Job description — required for request-based */}
          <Textarea
            label={isRequestBased ? 'Describe the job' : 'Additional notes (optional)'}
            placeholder={
              isRequestBased
                ? 'Describe what needs to be done, materials needed, size of the job...'
                : 'Any specific instructions or notes for the worker...'
            }
            rows={4}
            required={isRequestBased}
            error={errors.jobDescription?.message}
            hint={isRequestBased ? 'At least 15 characters — be as specific as possible' : undefined}
            {...register('jobDescription')}
          />

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Job location <span className="text-red-500">*</span>
            </label>
            <LocationPicker
              onSelect={(loc) => {
                setLocation(loc)
                setValue('location', loc, { shouldValidate: true })
              }}
            />
            {errors.location && (
              <p className="mt-1.5 text-xs text-red-500">Please select your location</p>
            )}
          </div>

          {/* Price estimate */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-1">Rate estimate</p>
            <p className="text-sm text-slate-700">
              {formatCurrency(worker?.hourlyRate ?? 0)} / hour · Final price agreed with worker
            </p>
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
            {isRequestBased ? 'Send job request' : 'Confirm booking'}
          </Button>
        </form>
      </main>
    </>
  )
}
