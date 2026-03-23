'use client'

import { useEffect, useState } from 'react'
import { Calendar, MapPin, Clock, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Booking, BookingStatus } from '@/types'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { formatDateTime, formatCurrency, BOOKING_STATUS_STYLES, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

const TABS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<BookingStatus | 'ALL'>('ALL')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    api.bookings.getClientBookings().then(res => {
      setBookings(res.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return
    setCancellingId(id)
    try {
      await api.bookings.cancel(id)
      setBookings(bs => bs.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
      toast.success('Booking cancelled')
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setCancellingId(null)
    }
  }

  const filtered = activeTab === 'ALL' ? bookings : bookings.filter(b => b.status === activeTab)

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1.5 text-xs text-slate-400">
                  ({bookings.filter(b => b.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No bookings yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'ALL' ? 'Your bookings will appear here' : `No ${activeTab.toLowerCase()} bookings`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking, i) => (
              <div
                key={booking.id}
                className="card p-5 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Worker avatar */}
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {booking.worker ? getInitials(booking.worker.name) : '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {booking.worker?.name ?? 'Worker'}
                        </p>
                        <p className="text-xs text-slate-500">{booking.worker?.profession}</p>
                      </div>
                      <span className={cn('badge text-xs shrink-0', BOOKING_STATUS_STYLES[booking.status])}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        {formatDateTime(booking.scheduledAt)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-brand-400" />
                        <span className="truncate">{booking.location.address}</span>
                      </div>
                    </div>

                    {booking.jobDescription && (
                      <p className="mt-2 text-xs text-slate-600 line-clamp-2 bg-slate-50 px-3 py-2 rounded-lg">
                        {booking.jobDescription}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(booking.totalAmount)}
                      </p>
                      {booking.status === 'PENDING' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                          isLoading={cancellingId === booking.id}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
