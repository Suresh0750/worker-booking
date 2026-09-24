'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Logo } from '@/components/layout/Logo'
import { api } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  User,
  MapPin,
  Wrench,
  Grid3X3,
  ImageIcon,
  FileText,
  Clock,
  ShieldCheck,
  MessageSquare,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    section: 'Overview',
    links: [
      { href: '/worker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/worker/messages', label: 'Messages', icon: MessageSquare, badge: true },
    ],
  },
  {
    section: 'My Work',
    links: [
      { href: '/worker/availability', label: 'Availability', icon: Clock },
      { href: '/worker/services', label: 'My Services', icon: Wrench },
      { href: '/worker/categories', label: 'My Categories', icon: Grid3X3 },
      { href: '/worker/portfolio', label: 'Portfolio', icon: ImageIcon },
    ],
  },
  {
    section: 'Personal',
    links: [
      { href: '/worker/profile', label: 'My Profile', icon: User },
      { href: '/worker/address', label: 'My Address', icon: MapPin },
      { href: '/worker/documents', label: 'Documents', icon: FileText },
      { href: '/worker/account', label: 'Account & Security', icon: ShieldCheck },
    ],
  },
]

export function WorkerSidebar() {
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
  useEffect(()=>{
    console.log("user",user)
  },[user])

  const sidebarContent = (
    <aside className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/worker/dashboard" onClick={() => setMobileOpen(false)}>
          <Logo variant="light" />
        </Link>
      </div>

      {/* User chip */}
      {user && (
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {getInitials(user.fullName ?? user.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName ?? user.email.split('@')[0]}</p>
              <p className="text-xs text-brand-600 font-medium">Worker account</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_ITEMS.map(({ section, links }) => (
          <div key={section}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section}
            </p>
            <div className="space-y-0.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/worker/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0 transition-transform group-hover:scale-110', active && 'scale-110')} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 bg-white fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <Link href="/worker/dashboard">
          <Logo variant="light" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
