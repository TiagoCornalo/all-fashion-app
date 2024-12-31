import api from './config/axios'
import { PaginatedResponse, Supplier } from '../types/inventory.types'

interface GetSuppliersParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getSuppliers = async (
  params: GetSuppliersParams = {}
): Promise<PaginatedResponse<Supplier>> => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder })
  })

  const response = await api.get(`/suppliers?${queryParams}`)
  return response.data
}
