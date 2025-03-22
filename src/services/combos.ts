import {
  CreateProductComboDto,
  UpdateProductComboDto
} from '../types/combos.types'
import api from './config/axios'

interface GetCombosParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getCombos = async (params: GetCombosParams) => {
  const queryParams = new URLSearchParams({
    ...(params.search && { search: params.search }),
    ...(params.page && { page: params.page.toString() }),
    ...(params.pageSize && { pageSize: params.pageSize.toString() }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder })
  })

  const response = await api.get(`/combos?${queryParams}`)
  return response.data
}

export const getComboById = async (id: string) => {
  const response = await api.get(`/combos/${id}`)
  return response.data
}

export const createCombo = async (combo: CreateProductComboDto) => {
  const response = await api.post('/combos', combo)
  return response.data
}

export const updateCombo = async (id: string, combo: UpdateProductComboDto) => {
  const response = await api.put(`/combos/${id}`, combo)
  return response.data
}

export const deleteCombo = async (id: string) => {
  const response = await api.delete(`/combos/${id}`)
  return response.data
}
