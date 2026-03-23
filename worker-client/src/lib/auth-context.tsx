'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AuthUser } from '@/types'
import { tokenStore } from '@/lib/api'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = tokenStore.getUser()
    setUserState(stored)
    setIsLoading(false)
  }, [])

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u)
    if (u) tokenStore.setUser(u)
    else tokenStore.clear()
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUserState(null)
    window.location.href = '/auth/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
