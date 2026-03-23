'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Plus, Clock, Trash2, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react'
import { slotSchema, SlotFormData } from '@/lib/validations'
import { api } from '@/lib/api'
import { TimeSlot, JobRequest, SlotType } from '@/types'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SlotsPage() {
  const [slotType, setSlotType] = useState<SlotType | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.worker.getProfile().then(res => {
      setSlotType(res.data.slotType)
      if (res.data.slotType === 'REQUEST_BASED') {
        api.worker.getJobRequests().then(r => {
          setJobRequests(r.data ?? [])
          setIsLoading(false)
        })
      } else {
        api.worker.getSlots().then(r => {
          setSlots(r.data ?? [])
          setIsLoading(false)
        })
      }
    })
  }, [])

  const handleDeleteSlot = async (id: string) => {
    await api.worker.deleteSlot(id)
    setSlots(ss => ss.filter(s => s.id !== id))
    toast.success('Slot deleted')
  }

  const handleAcceptJob = async (id: string) => {
    await api.worker.acceptJob(id)
    setJobRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'ACCEPTED' as const } : r))
    toast.success('Job accepted!')
  }

  const handleDeclineJob = async (id: string) => {
    await api.worker.declineJob(id)
    setJobRequests(rs => rs.map(r => r.id === id ? { ...r, status: 'DECLINED' as const } : r))
    toast.success('Job declined')
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

  // ── Request-based workers see job requests ──
  if (slotType === 'REQUEST_BASED') {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Job Requests</h1>
            <p className="text-sm text-slate-500">
              Clients post jobs matching your profession. Review and respond to each one.
            </p>
          </div>

          {jobRequests.length === 0 ? (
            <div className="text-center py-20 card">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-600">No job requests yet</p>
              <p className="text-sm text-slate-400 mt-1">New requests from clients will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobRequests.map((job, i) => (
                <div key={job.id} className="card p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{job.clientName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{job.location.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-700">{formatCurrency(job.budget)}</p>
                      <p className="text-xs text-slate-400">budget</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mb-3 bg-slate-50 p-3 rounded-xl leading-relaxed">
                    {job.description}
                  </p>

                  <div className="text-xs text-slate-400 mb-4">
                    {job.location.address} · {new Date(job.createdAt).toLocaleDateString('en-IN')}
                  </div>

                  {job.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleDeclineJob(job.id)}>
                        <XCircle className="w-4 h-4" /> Decline
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => handleAcceptJob(job.id)}>
                        <CheckCircle className="w-4 h-4" /> Accept
                      </Button>
                    </div>
                  ) : (
                    <div className={cn(
                      'text-center py-2 rounded-xl text-sm font-medium',
                      job.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    )}>
                      {job.status === 'ACCEPTED' ? '✓ Accepted' : '✕ Declined'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </>
    )
  }

  // ── Slot-based / Hybrid workers manage time slots ──
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Manage Slots</h1>
            <p className="text-sm text-slate-500">
              {slotType === 'SLOT_BASED'
                ? 'Create time slots. Clients can only book slots you define.'
                : 'Set your availability windows. Clients request jobs within them.'}
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} leftIcon={<Plus className="w-4 h-4" />}>
            Add slot
          </Button>
        </div>

        {/* New slot form */}
        {showForm && <SlotForm onCreated={(slot) => { setSlots(ss => [slot, ...ss]); setShowForm(false) }} />}

        {/* Slots list */}
        {slots.length === 0 ? (
          <div className="text-center py-20 card">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No slots yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first available time slot</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div
                key={slot.id}
                className={cn(
                  'card px-4 py-3.5 flex items-center justify-between gap-3 animate-fade-up',
                  slot.isBooked && 'border-blue-200 bg-blue-50/50'
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-10 rounded-full shrink-0', slot.isBooked ? 'bg-blue-400' : 'bg-brand-400')} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDateTime(slot.startTime)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      until {new Date(slot.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'badge text-xs',
                    slot.isBooked
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-green-100 text-green-700 border-green-200'
                  )}>
                    {slot.isBooked ? 'Booked' : 'Open'}
                  </span>
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

// ── Slot creation form ──

function SlotForm({ onCreated }: { onCreated: (slot: TimeSlot) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: { repeat: 'none' },
  })

  const onSubmit = async (data: SlotFormData) => {
    const res = await api.worker.createSlot(data)
    reset()
    onCreated(res.data)
    toast.success('Slot added!')
  }

  return (
    <div className="card p-5 mb-6 animate-fade-up border-brand-200 bg-brand-50/30">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-600" /> New slot
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start time *</label>
            <input
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              className={cn('input-base', errors.startTime && 'input-error')}
              {...register('startTime')}
            />
            {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">End time *</label>
            <input
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)}
              className={cn('input-base', errors.endTime && 'input-error')}
              {...register('endTime')}
            />
            {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700">Repeat:</label>
            <select {...register('repeat')} className="input-base py-2 text-sm w-auto">
              <option value="none">One time</option>
              <option value="weekly">Every week</option>
            </select>
          </div>
          <Button type="submit" isLoading={isSubmitting} size="sm">
            Add slot
          </Button>
        </div>
      </form>
    </div>
  )
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
    </svg>
  )
}
