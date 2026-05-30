// Roles disponibles en la aplicación
export type UserRole = 'ADMIN' | 'SELLER' | 'MANAGER' | 'TECHNICIAN' | 'USER' | 'GUEST'

// Información del usuario
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

// Credenciales para el login
export interface LoginCredentials {
  email: string
  password: string
}

// Respuesta del servidor al login
export interface LoginResponse {
  user: User
  token: string
}

// Respuesta de validación del token
export interface TokenValidationResponse {
  user: User
  isValid: boolean
}

// Estado del contexto de autenticación
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

// Contexto de autenticación
export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

// Tipo para verificar permisos
export type Permission = 'create' | 'read' | 'update' | 'delete'

// Mapa de permisos por rol
export const RolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: ['create', 'read', 'update', 'delete'],
  MANAGER: ['create', 'read', 'update'],
  SELLER: ['create', 'read'],
  TECHNICIAN: ['read', 'update'],
  USER: ['read'],
  GUEST: ['read']
}

// Utilidad para verificar permisos
export const hasPermission = (
  userRole: UserRole,
  requiredPermission: Permission
): boolean => {
  return RolePermissions[userRole].includes(requiredPermission)
}
