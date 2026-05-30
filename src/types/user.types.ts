export type UserRole = 'ADMIN' | 'SELLER' | 'MANAGER' | 'TECHNICIAN'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  createdAt: string
}

export interface CreateUser {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UpdateUser {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  active?: boolean
}

export interface UserResponse {
  data: User[]
  meta?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface CreateUserResponse {
  user: User
}

export interface UpdateUserResponse {
  message: string
  user: User
}

export interface DeleteUserResponse {
  message: string
  user: User
  deletedUser?: User
}
