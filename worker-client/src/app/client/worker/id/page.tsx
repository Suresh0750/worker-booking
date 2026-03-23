'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Star, MapPin, Clock, CheckCircle, IndianRupee, ArrowLeft, Phone, ChevronRight } from 'lucide-react'
import { WorkerProfile, TimeSlot } from '@/types'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { getInitials, formatCurrency, SLOT_TYPE_LABELS, formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [worker, setWorker] = useState<WorkerProfile | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.workers.getById(id),
      api.workers.getSlots(id),
    ]).then(([w, s]) => {
      setWorker(w.data)
      setSlots(s.data ?? [])
      setIsLoading(false)
    })
  }, [id])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6" />
          <div className="card p-6 mb-4">
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 bg-slate-200 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!worker) return null

  const availableSlots = slots.filter(s => !s.isBooked)

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to search
        </button>

        {/* Profile card */}
        <div className="card p-6 mb-4 animate-fade-up">
          <div className="flex gap-4 mb-5">
            {worker.avatarUrl ? (
              <img src={worker.avatarUrl} alt={worker.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-semibold shrink-0">
                {getInitials(worker.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-xl font-semibold text-slate-900">{worker.name}</h1>
                  <p className="text-slate-500 text-sm">{worker.profession}</p>
                </div>
                <div className={cn(
                  'badge shrink-0',
                  worker.isAvailable
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                )}>
                  <span className={cn('w-2 h-2 rounded-full', worker.isAvailable ? 'bg-green-500' : 'bg-slate-400')} />
                  {worker.isAvailable ? 'Available' : 'Busy'}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-3">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium">{worker.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({worker.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-brand-500" />
                  {worker.completedJobs} jobs
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {formatCurrency(worker.hourlyRate)}/hr
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-brand-400" />
            {worker.location.city} — {worker.location.address}
          </div>

          {/* Bio */}
          {worker.bio && (
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{worker.bio}</p>
          )}

          {/* Skills */}
          {worker.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {worker.skills.map(skill => (
                <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Booking type */}
          <div className={cn(
            'inline-flex items-center gap-2 badge text-sm',
            worker.slotType === 'SLOT_BASED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            worker.slotType === 'REQUEST_BASED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-purple-50 text-purple-700 border-purple-200'
          )}>
            <Clock className="w-3.5 h-3.5" />
            {SLOT_TYPE_LABELS[worker.slotType]?.label} — {SLOT_TYPE_LABELS[worker.slotType]?.desc}
          </div>
        </div>

        {/* Photos */}
        {worker.photos.length > 0 && (
          <div className="card p-5 mb-4 animate-fade-up" style={{ animationDelay: '80ms' }}>
            <h2 className="font-semibold text-slate-800 mb-3">Work photos</h2>
            <div className="grid grid-cols-3 gap-2">
              {worker.photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Work ${i + 1}`}
                  className="aspect-square object-cover rounded-xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        )}

        {/* Available slots (for slot-based workers) */}
        {worker.slotType !== 'REQUEST_BASED' && availableSlots.length > 0 && (
          <div className="card p-5 mb-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="font-semibold text-slate-800 mb-3">Available slots</h2>
            <div className="space-y-2">
              {availableSlots.slice(0, 5).map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-brand-400" />
                    {formatDateTime(slot.startTime)} — {new Date(slot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Link
                    href={`/client/book/${worker.id}?slotId=${slot.id}`}
                    className="text-brand-600 text-xs font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    Book <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <Button
            onClick={() => router.push(`/client/book/${worker.id}`)}
            className="flex-1"
            size="lg"
          >
            {worker.slotType === 'REQUEST_BASED' ? 'Send job request' : 'Book now'}
          </Button>
        </div>
      </main>
    </>
  )
}
