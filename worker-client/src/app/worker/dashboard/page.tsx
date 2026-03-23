'use client'

import { useEffect, useState, useRef } from 'react'
import { TrendingUp, Briefcase, Star, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { DashboardStats, Booking } from '@/types'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { formatCurrency, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function WorkerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.worker.getDashboard(),
      api.worker.getBookings('PENDING'),
    ]).then(([s, b]) => {
      setStats(s.data)
      setBookings(b.data ?? [])
      setIsLoading(false)
    })
  }, [])

  const handleConfirm = async (id: string) => {
    await api.worker.confirmBooking(id)
    setBookings(bs => bs.filter(b => b.id !== id))
    toast.success('Booking confirmed!')
  }

  const handleCancel = async (id: string) => {
    await api.worker.cancelBooking(id)
    setBookings(bs => bs.filter(b => b.id !== id))
    toast.success('Booking declined')
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

  const statCards = [
    { label: 'This month', value: formatCurrency(stats?.thisMonthEarnings ?? 0), icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total earned', value: formatCurrency(stats?.totalEarnings ?? 0), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Jobs done', value: String(stats?.completedJobs ?? 0), icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: String(stats?.pendingJobs ?? 0), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Rating', value: `${(stats?.rating ?? 0).toFixed(1)} ★`, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Cancelled', value: String(stats?.cancelledJobs ?? 0), icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
            <div
              key={label}
              className="card p-4 animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bg)}>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className="text-lg font-semibold text-slate-900 leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* Earnings chart */}
        {stats?.earningsByMonth && stats.earningsByMonth.length > 0 && (
          <div className="card p-6 mb-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <h2 className="font-semibold text-slate-800 mb-4">Earnings (last 6 months)</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.earningsByMonth}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    formatter={(v: number) => [formatCurrency(v), 'Earnings']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2}
                    fill="url(#earningsGrad)" dot={{ fill: '#16a34a', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pending bookings — drag to confirm/decline */}
        <div className="card p-6 animate-fade-up" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              Pending requests
              {bookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  {bookings.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block">Swipe or use buttons to respond</p>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(booking => (
                <DraggableBookingCard
                  key={booking.id}
                  booking={booking}
                  onConfirm={() => handleConfirm(booking.id)}
                  onDecline={() => handleCancel(booking.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

// ── Draggable booking card ──────────────────────────────────

function DraggableBookingCard({
  booking,
  onConfirm,
  onDecline,
}: {
  booking: Booking
  onConfirm: () => void
  onDecline: () => void
}) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [decided, setDecided] = useState<'confirmed' | 'declined' | null>(null)
  const startX = useRef(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setDragX(e.clientX - startX.current)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    if (dragX > 90) {
      setDecided('confirmed')
      setTimeout(onConfirm, 400)
    } else if (dragX < -90) {
      setDecided('declined')
      setTimeout(onDecline, 400)
    } else {
      setDragX(0)
    }
  }

  if (decided) {
    return (
      <div className={cn(
        'rounded-xl p-4 text-sm font-medium text-center animate-fade-in',
        decided === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
      )}>
        {decided === 'confirmed' ? '✓ Booking confirmed' : '✕ Booking declined'}
      </div>
    )
  }

  const swipePercent = Math.min(Math.abs(dragX) / 90, 1)
  const isRight = dragX > 20
  const isLeft = dragX < -20

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background hint layers */}
      <div className="absolute inset-0 rounded-xl flex">
        <div
          className="flex-1 flex items-center px-5 rounded-xl bg-green-50 transition-opacity duration-150"
          style={{ opacity: isRight ? swipePercent : 0 }}
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="ml-2 text-sm font-semibold text-green-700">Confirm</span>
        </div>
        <div
          className="flex-1 flex items-center justify-end px-5 rounded-xl bg-red-50 transition-opacity duration-150"
          style={{ opacity: isLeft ? swipePercent : 0 }}
        >
          <span className="mr-2 text-sm font-semibold text-red-600">Decline</span>
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Card */}
      <div
        className="relative bg-white border border-slate-200 rounded-xl p-4 select-none touch-pan-y"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold shrink-0">
            {getInitials(booking.clientName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{booking.clientName}</p>
            {booking.jobDescription && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{booking.jobDescription}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs font-semibold text-brand-700">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={(e) => { e.stopPropagation(); onDecline() }}
            className="flex-1 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfirm() }}
            className="flex-1 py-2 rounded-lg text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            Confirm
          </button>
        </div>
        <p className="text-center text-xs text-slate-300 mt-2">← swipe to decline · swipe to confirm →</p>
      </div>
    </div>
  )
}
