'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  ShieldCheck, Key, Monitor, Loader2, LogOut, AlertTriangle, CheckCircle, Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordFormData = z.infer<typeof passwordSchema>

interface Session {
  id: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export default function AccountPage() {
  const { logout } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  useEffect(() => {
    api.worker.getSessions()
      .then(res => { setSessions(res.data ?? []); setLoadingSessions(false) })
      .catch(() => setLoadingSessions(false))
  }, [])

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await api.worker.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password updated!')
      reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update password')
    }
  }

  const handleRevokeSession = async (id: string) => {
    setRevokingId(id)
    try {
      await api.worker.revokeSession(id)
      setSessions(s => s.filter(sess => sess.id !== id))
      toast.success('Session revoked')
    } catch {
      toast.error('Failed to revoke session')
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async () => {
    setRevokingAll(true)
    try {
      await api.worker.revokeAllSessions()
      toast.success('All sessions revoked — you will be logged out')
      setTimeout(() => logout(), 1500)
    } catch {
      toast.error('Failed to revoke sessions')
      setRevokingAll(false)
    }
  }

  const parseUA = (ua?: string) => {
    if (!ua) return 'Unknown device'
    if (ua.includes('Mobile')) return '📱 Mobile browser'
    if (ua.includes('Chrome')) return '🌐 Chrome'
    if (ua.includes('Firefox')) return '🦊 Firefox'
    if (ua.includes('Safari')) return '🧭 Safari'
    return '💻 Desktop browser'
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Account & Security</h1>
        <p className="text-sm text-slate-500">Manage your password and active sessions</p>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-5">
          <Key className="w-4 h-4 text-brand-600" /> Change password
        </h2>

        <form onSubmit={handleSubmit(onPasswordSubmit)} noValidate className="space-y-4">
          <Input
            label="Current password"
            type="password"
            required
            error={errors.currentPassword?.message}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
            {...register('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            required
            error={errors.newPassword?.message}
            hint="Minimum 8 characters"
            leftIcon={<Key className="w-4 h-4" />}
            {...register('newPassword')}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            error={errors.confirmPassword?.message}
            leftIcon={<Key className="w-4 h-4" />}
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Update password
          </Button>
        </form>
      </div>

      {/* Active sessions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-brand-600" /> Active sessions
          </h2>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50 flex items-center gap-1"
            >
              {revokingAll
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <LogOut className="w-3.5 h-3.5" />}
              Log out all devices
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No active sessions found</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((sess, i) => (
              <div
                key={sess.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 animate-fade-up',
                  i === 0 && 'border-brand-200 bg-brand-50/30'
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="text-xl shrink-0">{parseUA(sess.userAgent).split(' ')[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {parseUA(sess.userAgent).slice(2)}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-semibold text-brand-700 bg-brand-100 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {sess.ipAddress ?? 'Unknown IP'} ·{' '}
                    {new Date(sess.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {i !== 0 && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    disabled={revokingId === sess.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Revoke session"
                  >
                    {revokingId === sess.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-100">
        <h2 className="font-semibold text-red-700 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" /> Danger zone
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Logging out will end your current session. You will need to sign in again to access your account.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            try { await api.auth.logout() } catch { /* ignore */ }
            logout()
            toast.success('Logged out')
          }}
          leftIcon={<LogOut className="w-4 h-4" />}
          className="border-red-200 text-red-600 hover:bg-red-50"
        >
          Log out
        </Button>
      </div>
    </main>
  )
}
