import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mm_admin_token'))
  const [user, setUser]   = useState(null)

  // Fetch /api/me/ whenever we have a valid token
  useEffect(() => {
    if (!token) { setUser(null); return }
    api.get('/api/me/')
      .then(r => setUser(r.data))
      .catch(() => setUser(null))
  }, [token])

  const login = useCallback(async (username, password) => {
    const res = await axios.post('/api/token/', { username, password })
    localStorage.setItem('mm_admin_token', res.data.access)
    localStorage.setItem('mm_admin_refresh', res.data.refresh)
    setToken(res.data.access)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('mm_admin_token')
    localStorage.removeItem('mm_admin_refresh')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      isSuperuser:     user?.is_superuser ?? false,
      isCVT:           user?.is_cvt ?? false,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
