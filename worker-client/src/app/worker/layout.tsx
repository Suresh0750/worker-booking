import { WorkerSidebar } from '@/components/layout/WorkerSidebar'

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <WorkerSidebar />

      {/* Main content — offset by sidebar width on desktop, top bar on mobile */}
      <div className="lg:pl-60">
        <main className="min-h-screen pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}
