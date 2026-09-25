'use client'

import { cn } from '@/lib/utils'

interface AppLoaderProps {
  variant?: 'full' | 'compact' | 'skeleton'
  className?: string
  title?: string
  subtitle?: string
}

export function AppLoader({
  variant = 'full',
  className,
  title = 'Loading…',
  subtitle = 'Preparing your workspace',
}: AppLoaderProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('w-full h-full', className)}>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
        <LoaderLogo />
        <ProgressStripes className="w-40" />
      </div>
    )
  }

  return (
    <div className={cn(
      'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-secondary',
      className
    )}>
      <div className="relative flex flex-col items-center gap-6 px-8 animate-fade-in">
        <div className="absolute -inset-16 rounded-full bg-brand-500/10 blur-3xl animate-pulse" aria-hidden />

        <LoaderLogo size={72} />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-500">{subtitle}</p>

          <div className="mt-3 w-64">
            <ProgressStripes />
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
            <Dots />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────────── */

export function LoaderLogo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full border-4 border-brand-200"
        aria-hidden
      />
      <div
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 animate-spin"
        style={{ animationDuration: '0.9s' }}
        aria-hidden
      />
      <svg
        viewBox="0 0 24 24"
        width={size * 0.5}
        height={size * 0.5}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    </div>
  )
}

export function ProgressStripes({ className }: { className?: string }) {
  return (
    <div className={cn(
      'relative h-2 w-full overflow-hidden rounded-full bg-brand-100',
      className
    )}>
      <div
        className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[repeating-linear-gradient(45deg,var(--brand-400)_0_12px,var(--brand-500)_12px_24px,var(--brand-600)_24px_36px)] animate-progress-bar"
        style={{ backgroundSize: '200% 100%' }}
      />
    </div>
  )
}

function Dots() {
  return (
    <>
      <span className="text-slate-400">WorkerHub</span>
      <span className="inline-flex gap-0.5 ml-1">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '120ms' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: '240ms' }} />
      </span>
    </>
  )
}
