import Link from 'next/link'
import { Search, Shield, Star, Clock } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo variant='light' />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary py-2 px-4 text-sm">Login</Link>
          <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 text-brand-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Find verified workers near you
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-semibold text-slate-900 leading-tight mb-6">
          Skilled workers,<br />
          <span className="text-brand-600">on demand</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Connect with trusted carpenters, plumbers, electricians and more.
          Book by time slot or post a job request — your choice.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth/register?role=USER" className="btn-primary text-base py-3.5 px-8">
            Find a worker
          </Link>
          <Link href="/auth/register?role=WORKER" className="btn-secondary text-base py-3.5 px-8">
            Join as a worker
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Smart search', desc: 'Filter by profession, rating, location, and availability. Find exactly who you need.', color: 'bg-blue-50 text-blue-600' },
            { icon: Clock, title: 'Flexible booking', desc: 'Book a time slot, or post a job request. Workers who suit your needs will respond.', color: 'bg-amber-50 text-amber-600' },
            { icon: Shield, title: 'Verified & rated', desc: 'Every worker is rated by real clients. Reviews are verified after job completion.', color: 'bg-green-50 text-green-600' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="card p-10">
          <h2 className="font-display text-3xl font-semibold text-slate-900 mb-3">Ready to get started?</h2>
          <p className="text-slate-500 mb-6">Join WorkerHub today — free for clients, simple for workers</p>
          <Link href="/auth/register" className="btn-primary text-base py-3 px-8 inline-flex">
            Create free account
          </Link>
        </div>
      </section>
    </div>
  )
}
