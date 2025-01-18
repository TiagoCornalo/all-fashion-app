import { useState, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import { authService } from '../../services/auth.service'
import { User } from '../../types/auth.types'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    validateAuth()
  }, [])

  const validateAuth = async () => {
    try {
      if (!authService.hasValidToken()) {
        setIsAuthenticated(false)
        return
      }

      const response = await authService.validateToken()
      if (response) {
        setIsAuthenticated(true)
        setUser(response.user as User)
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error('Error validating auth:', error)
      handleLogout()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (credentials: {
    email: string
    password: string
  }) => {
    const response = await authService.login(credentials)
    setUser(response.user as User)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login: handleLogin,
        logout: handleLogout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
