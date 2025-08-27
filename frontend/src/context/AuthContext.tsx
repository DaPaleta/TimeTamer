import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  refreshToken as apiRefreshToken,
} from '../api/auth'
import { useNavigate } from 'react-router-dom'

interface AuthContextType {
  user: string | null
  isAuthenticated: boolean
  accessToken: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USERNAME_KEY = 'username'
const EXPIRES_AT_KEY = 'expires_at'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY)
  )
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem(REFRESH_TOKEN_KEY)
  )
  const [user, setUser] = useState<string | null>(localStorage.getItem(USERNAME_KEY))
  const [expiresAt, setExpiresAt] = useState<number | null>(
    localStorage.getItem(EXPIRES_AT_KEY) ? Number(localStorage.getItem(EXPIRES_AT_KEY)) : null
  )
  const refreshTimeout = useRef<number | null>(null)

  const isAuthenticated = !!accessToken

  // Store tokens and expiry in localStorage
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    if (user) {
      localStorage.setItem(USERNAME_KEY, user)
    } else {
      localStorage.removeItem(USERNAME_KEY)
    }
    if (expiresAt) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt))
    } else {
      localStorage.removeItem(EXPIRES_AT_KEY)
    }
  }, [accessToken, refreshToken, user, expiresAt])

  // Proactive refresh logic
  useEffect(() => {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current)
    }
    if (accessToken && refreshToken && expiresAt) {
      const now = Date.now()
      const msUntilRefresh = Math.max(expiresAt - now - 60 * 1000, 0) // refresh 1 min before expiry
      refreshTimeout.current = window.setTimeout(() => {
        handleRefresh()
      }, msUntilRefresh)
    }
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, refreshToken, expiresAt])

  const handleRefresh = async () => {
    if (!refreshToken) return logout()
    try {
      const res = await apiRefreshToken(refreshToken)
      setAccessToken(res.access_token)
      setRefreshToken(res.refresh_token)
      setExpiresAt(Date.now() + res.expires_in * 1000)
    } catch {
      logout()
    }
  }

  const login = async (username: string, password: string) => {
    const res = await apiLogin(username, password)
    setAccessToken(res.access_token)
    setRefreshToken(res.refresh_token)
    setUser(username)
    setExpiresAt(Date.now() + res.expires_in * 1000)
  }

  const register = async (username: string, email: string, password: string) => {
    const res = await apiRegister(username, email, password)
    setAccessToken(res.access_token)
    setRefreshToken(res.refresh_token)
    setUser(username)
    setExpiresAt(Date.now() + res.expires_in * 1000)
  }

  const logout = () => {
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
    setExpiresAt(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, accessToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
