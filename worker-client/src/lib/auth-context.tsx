'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AuthUser, WorkerAddress, WorkerDocument } from '@/types'
import { tokenStore } from '@/lib/api'

// ─── Storage helpers ──────────────────────────────────────────────────────────

const ADDRESSES_KEY  = 'user_addresses'
const DOCUMENTS_KEY  = 'user_documents'

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  if (value === null || value === undefined) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

function clearAll(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADDRESSES_KEY)
  localStorage.removeItem(DOCUMENTS_KEY)
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  user:      AuthUser | null
  isLoading: boolean

  /** Full address list (eagerly loaded at login, kept in sync with address page mutations) */
  addresses:  WorkerAddress[]
  /** Verification documents (populated lazily when the documents page loads) */
  documents:  WorkerDocument[]

  /** Replace the entire user object and persist it */
  setUser: (user: AuthUser | null) => void
  /** Patch individual fields on the stored user (e.g. after profile edit) */
  patchUser: (patch: Partial<AuthUser>) => void
  /** Overwrite address list (called after address page fetches / mutates) */
  setAddresses: (addresses: WorkerAddress[]) => void
  /** Overwrite document list (called after documents page fetches / mutates) */
  setDocuments: (documents: WorkerDocument[]) => void

  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user:         null,
  isLoading:    true,
  addresses:    [],
  documents:    [],
  setUser:      () => {},
  patchUser:    () => {},
  setAddresses: () => {},
  setDocuments: () => {},
  logout:       () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUserState]      = useState<AuthUser | null>(null)
  const [addresses, setAddressState]   = useState<WorkerAddress[]>([])
  const [documents, setDocumentState]  = useState<WorkerDocument[]>([])
  const [isLoading, setIsLoading]      = useState(true)

  // Hydrate from localStorage on first mount
  useEffect(() => {
    const storedUser  = tokenStore.getUser()
    const storedAddrs = readJson<WorkerAddress[]>(ADDRESSES_KEY) ?? []
    const storedDocs  = readJson<WorkerDocument[]>(DOCUMENTS_KEY) ?? []

    setUserState(storedUser)
    setAddressState(storedAddrs)
    setDocumentState(storedDocs)

    // Re-sync the middleware-readable cookies on every page load / reload
    // (they could have expired while localStorage still has the data)
    if (storedUser) {
      const token = tokenStore.get()
      if (token) {
        document.cookie = `access_token=${token}; path=/; SameSite=Strict; max-age=${15 * 60}`
      }
      document.cookie = `user_role=${storedUser.role}; path=/; SameSite=Strict; max-age=${30 * 24 * 60 * 60}`
    }

    setIsLoading(false)
  }, [])

  // ── setUser ───────────────────────────────────────────────────────────────
  const setUser = useCallback((u: AuthUser | null) => {
    if (u) {
      // Separate addresses out of the user object into their own store
      const { addresses: addrs, ...userWithoutAddresses } = u
      tokenStore.setUser(userWithoutAddresses as AuthUser)
      setUserState(userWithoutAddresses as AuthUser)

      if (addrs?.length) {
        const mapped: WorkerAddress[] = addrs.map((a: any) => ({
          id:        a.id,
          userId:    u.id,
          line1:     a.line1,
          line2:     a.line2 ?? undefined,
          city:      a.city,
          state:     a.state,
          pincode:   a.pincode,
          lat:       a.lat ?? undefined,
          lng:       a.lng ?? undefined,
          label:     a.label ?? undefined,
          isPrimary: a.isPrimary,
          createdAt: a.createdAt ?? new Date().toISOString(),
        }))
        setAddressState(mapped)
        writeJson(ADDRESSES_KEY, mapped)
      }
    } else {
      void tokenStore.clear()
      setUserState(null)
    }
  }, [])

  // ── patchUser ─────────────────────────────────────────────────────────────
  const patchUser = useCallback((patch: Partial<AuthUser>) => {
    setUserState(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      tokenStore.setUser(updated)
      return updated
    })
  }, [])

  // ── setAddresses ──────────────────────────────────────────────────────────
  const setAddresses = useCallback((addrs: WorkerAddress[]) => {
    setAddressState(addrs)
    writeJson(ADDRESSES_KEY, addrs)
  }, [])

  // ── setDocuments ──────────────────────────────────────────────────────────
  const setDocuments = useCallback((docs: WorkerDocument[]) => {
    setDocumentState(docs)
    writeJson(DOCUMENTS_KEY, docs)
  }, [])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    void tokenStore.clear()
    clearAll()
    setUserState(null)
    setAddressState([])
    setDocumentState([])
    window.location.href = '/auth/login'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      addresses,
      documents,
      setUser,
      patchUser,
      setAddresses,
      setDocuments,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
