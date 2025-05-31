import {
  User,
  CreateUser,
  UpdateUser,
  UserResponse,
  CreateUserResponse,
  UpdateUserResponse,
  DeleteUserResponse
} from '../types/user.types'
import api from './config/axios'

/**
 * Obtener lista de usuarios (solo admin)
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/auth/users')
  return response.data
}

/**
 * Crear nuevo usuario (solo admin)
 */
export const createUser = async (userData: CreateUser): Promise<CreateUserResponse> => {
  const response = await api.post('/auth/users', userData)
  return response.data
}

/**
 * Editar usuario (solo admin)
 */
export const updateUser = async (id: string, userData: UpdateUser): Promise<UpdateUserResponse> => {
  const response = await api.put(`/auth/users/${id}`, userData)
  return response.data
}

/**
 * Desactivar usuario - soft delete (solo admin)
 */
export const deactivateUser = async (id: string): Promise<DeleteUserResponse> => {
  const response = await api.delete(`/auth/users/${id}`)
  return response.data
}

/**
 * Borrar usuario permanentemente (solo admin) - USAR CON PRECAUCIÓN
 */
export const deleteUserPermanently = async (id: string): Promise<DeleteUserResponse> => {
  const response = await api.delete(`/auth/users/${id}/permanent`)
  return response.data
}