import { AppLoader, LoaderLogo, ProgressStripes } from '@/components/ui/AppLoader'
import { WorkerSidebar } from '@/components/layout/WorkerSidebar'

export default function WorkerLoading() {
  return (
    <div className="min-h-screen bg-surface-secondary flex">
      <WorkerSidebar className="opacity-70 pointer-events-none select-none" />
      <main className="flex-1 min-w-0 flex items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center gap-5 animate-fade-in">
          <LoaderLogo size={56} />
          <div className="text-center space-y-1">
            <h2 className="font-display text-lg font-semibold text-slate-800">Worker Portal</h2>
            <p className="text-sm text-slate-500">Loading your dashboard…</p>
          </div>
          <ProgressStripes className="w-48" />

          <div className="mt-4 w-full max-w-xl space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card p-5 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-8 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
            <div className="card p-5 space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
