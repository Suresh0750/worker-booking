import Link from 'next/link'
import { Star, MapPin, Clock, IndianRupee, CheckCircle } from 'lucide-react'
import { WorkerProfile } from '@/types'
import { getInitials, formatCurrency, SLOT_TYPE_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface WorkerCardProps {
  worker: WorkerProfile
}

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Link
      href={`/client/worker/${worker.id}`}
      className="card p-5 flex flex-col gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {worker.avatarUrl ? (
            <img
              src={worker.avatarUrl}
              alt={worker.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(worker.name)}
            </div>
          )}
          {worker.isAvailable && (
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>

        {/* Name + profession */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-brand-700 transition-colors truncate">
            {worker.name}
          </h3>
          <p className="text-sm text-slate-500 truncate">{worker.profession}</p>
        </div>

        {/* Rate */}
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-0.5">
            <IndianRupee className="w-3.5 h-3.5" />{worker.hourlyRate}
          </p>
          <p className="text-xs text-slate-400">/hour</p>
        </div>
      </div>

      {/* Rating + jobs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium text-slate-700">{worker.rating.toFixed(1)}</span>
          <span className="text-xs text-slate-400">({worker.reviewCount})</span>
        </div>
        <span className="text-slate-200">·</span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <CheckCircle className="w-3.5 h-3.5 text-brand-500" />
          {worker.completedJobs} jobs done
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="truncate">{worker.location.city}</span>
      </div>

      {/* Skills */}
      {worker.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {worker.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
              {skill}
            </span>
          ))}
          {worker.skills.length > 3 && (
            <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs">
              +{worker.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Booking type badge */}
      <div className={cn(
        'self-start badge text-xs',
        worker.slotType === 'SLOT_BASED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
        worker.slotType === 'REQUEST_BASED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
        'bg-purple-50 text-purple-700 border-purple-200'
      )}>
        <Clock className="w-3 h-3" />
        {SLOT_TYPE_LABELS[worker.slotType]?.label}
      </div>
    </Link>
  )
}
