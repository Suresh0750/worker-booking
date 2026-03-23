'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Home, Search, Calendar, LayoutDashboard,
  Clock, Briefcase, ImageIcon, User, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await api.auth.logout()
    } catch { /* ignore */ }
    logout()
    toast.success('Logged out')
  }

  const clientLinks = [
    { href: '/client/search', label: 'Find Workers', icon: Search },
    { href: '/client/bookings', label: 'My Bookings', icon: Calendar },
  ]

  const workerLinks = [
    { href: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/worker/slots', label: 'Slots & Jobs', icon: Clock },
    { href: '/worker/photos', label: 'Photos', icon: ImageIcon },
    { href: '/worker/profile', label: 'Profile', icon: User },
  ]

  const links = user?.role === 'WORKER' ? workerLinks : clientLinks

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-slate-900 text-lg">WorkerHub</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold">
                    {getInitials(user.email)}
                  </div>
                  <button onClick={handleLogout} className="btn-ghost text-slate-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <button
                  className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && user && (
        <div className="fixed inset-x-0 top-16 z-40 bg-white border-b border-slate-100 shadow-lg md:hidden animate-fade-in">
          <nav className="p-4 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16" />
    </>
  )
}
