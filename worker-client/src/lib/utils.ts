import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function getInitials(name: string) {
  if(!name) return
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const PROFESSIONS = [
  'Carpenter',
  'Plumber',
  'Electrician',
  'Painter',
  'Mason',
  'Welder',
  'Cleaner',
  'Gardener',
  'Driver',
  'AC Technician',
  'Pest Control',
  'Handyman',
] as const

export const SLOT_TYPE_LABELS: Record<string, { label: string; desc: string; example: string }> = {
  SLOT_BASED: {
    label: 'Time Slots',
    desc: 'You define your available time slots. Clients can only book a slot you create.',
    example: 'Best for: Barbers, Tutors, Cleaners',
  },
  REQUEST_BASED: {
    label: 'Job Requests',
    desc: 'Clients post what they need. You review each request and accept or decline.',
    example: 'Best for: Carpenters, Plumbers, Electricians',
  },
  HYBRID: {
    label: 'Hybrid',
    desc: 'Set general availability windows; clients request jobs within those hours.',
    example: 'Best for: Multi-skilled or freelance workers',
  },
}

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
}
