import { createContext } from 'react'
import { User } from '../../types/auth.types'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
