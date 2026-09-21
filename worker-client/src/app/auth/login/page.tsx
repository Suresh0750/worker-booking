'use client'

import {  useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'
import LoginForm from '@/components/users/LoginForm'
import RegisterForm from '@/components/users/RegisterForm'
import { Sparkles } from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────────────────
type Tab = 'login' | 'register'


// ─── Page shell ───────────────────────────────────────────────────────────────
export default function AuthPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) === 'register' ? 'register' : 'login'
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-16 w-64 h-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo variant="square" className="h-10 w-10 rounded-xl" />
          <span className="text-white font-display font-semibold text-xl tracking-tight">WorkerHub</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <p className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Work made simple
          </p>
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Find the right help.<br />Get more done.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            One trusted place for people who need a hand and skilled workers ready to help.
          </p>

          {/* Illustration */}
          <div className="rounded-2xl overflow-hidden mt-4 max-w-sm">
            <img
              src="/login-illustration.svg"
              alt="Workers illustration"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        <div className="relative z-10" />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f9fafb] overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <Logo variant="square" className="h-10 w-10 rounded-xl" />
            <span className="font-display font-semibold text-xl text-slate-900">WorkerHub</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200',
                tab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Sign up
            </button>
          </div>

          {/* Active form */}
          {tab === 'login' ? (
            <LoginForm onSwitchTab={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitchTab={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
