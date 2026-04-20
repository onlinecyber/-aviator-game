import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('aviator_token'))
  const [loading, setLoading] = useState(true)

  // Bootstrap on mount
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchMe()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data.user)
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('aviator_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/api/auth/register', { username, email, password })
    localStorage.setItem('aviator_token', data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aviator_token')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const updateBalance = useCallback((balance) => {
    setUser((prev) => prev ? { ...prev, balance } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateBalance, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
