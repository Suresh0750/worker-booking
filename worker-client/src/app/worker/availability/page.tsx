'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Availability } from '@/types'
import { cn } from '@/lib/utils'

const OPTIONS: {
  value: Availability
  label: string
  description: string
  color: string
  bg: string
  ring: string
  dot: string
}[] = [
  {
    value: 'AVAILABLE',
    label: 'Available',
    description: 'You are visible in search and accepting new bookings from clients.',
    color: 'text-green-800',
    bg: 'bg-green-50 border-green-300',
    ring: 'ring-green-400',
    dot: 'bg-green-500',
  },
  {
    value: 'BUSY',
    label: 'Busy',
    description: 'You are hidden from new searches but existing clients can still message you.',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-300',
    ring: 'ring-amber-400',
    dot: 'bg-amber-500',
  },
  {
    value: 'UNAVAILABLE',
    label: 'Unavailable',
    description: 'You are fully offline. Clients cannot find or contact you.',
    color: 'text-red-800',
    bg: 'bg-red-50 border-red-300',
    ring: 'ring-red-400',
    dot: 'bg-red-500',
  },
]

export default function AvailabilityPage() {
  const [current, setCurrent] = useState<Availability | null>(null)
  const [saving, setSaving] = useState<Availability | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.worker.getFullProfile()
      .then(res => { setCurrent(res.data.availability); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const handleChange = async (value: Availability) => {
    if (value === current || saving) return
    setSaving(value)
    try {
      await api.worker.updateAvailability(value)
      setCurrent(value)
      toast.success(`Status set to ${value.toLowerCase()}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update availability')
    } finally {
      setSaving(null)
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
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Availability</h1>
        <p className="text-sm text-slate-500">
          Control whether clients can find and book you right now.
        </p>
      </div>

      {/* Current status */}
      {current && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border mb-8',
          OPTIONS.find(o => o.value === current)?.bg
        )}>
          <span className={cn('w-2.5 h-2.5 rounded-full animate-pulse shrink-0', OPTIONS.find(o => o.value === current)?.dot)} />
          <p className={cn('text-sm font-semibold', OPTIONS.find(o => o.value === current)?.color)}>
            Current status: {current.charAt(0) + current.slice(1).toLowerCase()}
          </p>
        </div>
      )}

      {/* Options */}
      <div className="space-y-3">
        {OPTIONS.map(opt => {
          const isActive = current === opt.value
          const isSaving = saving === opt.value

          return (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              disabled={!!saving}
              className={cn(
                'w-full text-left card p-5 flex items-center gap-4 transition-all duration-200',
                isActive
                  ? `border-2 ${opt.bg} ring-2 ${opt.ring}`
                  : 'hover:border-slate-300 hover:bg-slate-50',
                saving && saving !== opt.value && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="shrink-0">
                {isSaving ? (
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                ) : isActive ? (
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', opt.dot)}>
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                )}
              </div>

              <div className="flex-1">
                <p className={cn('font-semibold text-sm', isActive ? opt.color : 'text-slate-800')}>
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-slate-400 text-center mt-6">
        Changes take effect immediately. You can switch at any time.
      </p>
    </main>
  )
}
