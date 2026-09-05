import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'
import { decodeToken, isTokenExpired } from '../utils/formatters'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  // Verify token expiry on load
  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        logout()
      } else {
        // Double check decoded role
        const decoded = decodeToken(token)
        if (decoded?.role && user && user.role !== decoded.role) {
          const updated = { ...user, role: decoded.role }
          setUser(updated)
          localStorage.setItem('user', JSON.stringify(updated))
        }
      }
    }
    setLoading(false)
  }, [token])

  // Listen for 401 automatic logout dispatched by api interceptor
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = async (credentials) => {
    // credentials: { email, password }
    const data = await authService.login(credentials)
    // Response: { id, name, email, token }
    const { token: jwtToken, ...userData } = data

    // Extract role from JWT claims
    const decoded = decodeToken(jwtToken)
    let role = decoded?.role || 'USER'
    if (role.startsWith('ROLE_')) {
      role = role.replace('ROLE_', '')
    }

    const fullUser = {
      ...userData,
      role,
    }

    localStorage.setItem('token', jwtToken)
    localStorage.setItem('user', JSON.stringify(fullUser))

    setToken(jwtToken)
    setUser(fullUser)

    return fullUser
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const updateProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData }
    localStorage.setItem('user', JSON.stringify(newUser))
    setUser(newUser)
  }

  const isAuthenticated = Boolean(token && !isTokenExpired(token))
  const isAdmin = Boolean(user && user.role === 'ADMIN')

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        updateProfile,
      }}
    >
      {!loading && children}
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
