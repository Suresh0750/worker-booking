import { LoaderLogo, ProgressStripes } from '@/components/ui/AppLoader'
import { Navbar } from '@/components/layout/Navbar'

export default function ClientLoading() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="opacity-80 pointer-events-none select-none">
        <Navbar />
      </div>
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <LoaderLogo size={52} />
          <div className="text-center space-y-1">
            <h2 className="font-display text-lg font-semibold text-slate-800">Finding workers…</h2>
            <p className="text-sm text-slate-500">Matching you with the best local talent</p>
          </div>
          <ProgressStripes className="w-48" />
        </div>

        <div className="w-full animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-6 self-start" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
