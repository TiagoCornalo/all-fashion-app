import api from './config/axios'
import { PaginatedResponse, Supplier } from '../types/inventory.types'

interface GetSuppliersParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, string>
}

interface GetSupplierTransfersParams {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export const getSuppliers = async (
  params: GetSuppliersParams = {}
): Promise<PaginatedResponse<Supplier>> => {
  let sortBy = params.sortBy

  if (sortBy === 'contact.email') sortBy = 'contact.email'
  if (sortBy === 'contact.phone') sortBy = 'contact.phone'

  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(sortBy && { sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...Object.entries(params.filters || {}).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [`filter[${key}]`]: value
      }),
      {}
    )
  })

  const response = await api.get(`/suppliers?${queryParams}`)
  return response.data
}

export const createSupplier = async (supplier: Supplier) => {
  const response = await api.post('/suppliers', supplier)
  return response.data
}

export const getSupplierById = async (id: string) => {
  const response = await api.get(`/suppliers/${id}`)
  return response.data
}

export const updateSupplier = async (id: string, supplier: Supplier) => {
  const response = await api.put(`/suppliers/${id}`, supplier)
  return response.data
}

export const deleteSupplier = async (
  id: string,
  payload?: {
    transferToSupplierId?: string
    forceDelete?: boolean
  }
) => {
  const response = await api.delete(`/suppliers/${id}`, { data: payload })
  return response.data
}

export const getSupplierTransfers = async (id: string, params: GetSupplierTransfersParams = {}) => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.search && { search: params.search })
  })

  const response = await api.get(`/suppliers/${id}/transfers?${queryParams}`)
  return response.data
}