import api from './config/axios'

interface DecodedToken {
  role: string
  exp: number
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

class AuthService {
  hasValidToken(): boolean {
    const token = localStorage.getItem('token')
    if (!token) return false

    try {
      const [, payload] = token.split('.')
      const decodedToken = JSON.parse(atob(payload)) as DecodedToken

      const currentTime = Math.floor(Date.now() / 1000)
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        this.logout()
        return false
      }

      return true
    } catch {
      this.logout()
      return false
    }
  }

  async validateToken(): Promise<{ user: User } | null> {
    try {
      if (!this.hasValidToken()) {
        return null
      }

      const { data } = await api.get('/auth/validate')
      return data
    } catch (error) {
      console.error('Error al validar el token:', error)
      this.logout()
      return null
    }
  }

  async login(credentials: {
    email: string
    password: string
  }): Promise<{ user: User }> {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  getToken() {
    return localStorage.getItem('token')
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}')
  }

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('activeCashRegister')
  }

  isAuthenticated(): boolean {
    return this.hasValidToken()
  }
}

export const authService = new AuthService()
