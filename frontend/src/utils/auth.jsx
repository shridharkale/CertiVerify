import { createContext, useContext, useState } from 'react'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cv_user')
      const token = localStorage.getItem('cv_token')
      if (!stored || !token) return null
      return JSON.parse(stored)
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const persistSession = (token, userData) => {
    if (!token || !userData) {
      throw new Error('Sign-in did not return a valid session')
    }
    localStorage.setItem('cv_token', token)
    localStorage.setItem('cv_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      return persistSession(res.data.token, res.data.user)
    } catch (err) {
      throw new Error(getApiError(err, 'Sign in failed'))
    } finally {
      setLoading(false)
    }
  }

  const register = async (email, password, name) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/register', { email, password, name })
      if (!res.data?.token) {
        throw new Error(res.data?.error || 'Account created. Please sign in.')
      }
      return persistSession(res.data.token, res.data.user)
    } catch (err) {
      if (err.message && !err.response) throw err
      throw new Error(getApiError(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    localStorage.removeItem('cv_token')
    localStorage.removeItem('cv_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
