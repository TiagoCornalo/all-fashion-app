import api from './config/axios'
import { Sale } from '../types/sale.types'

interface GetSalesResponse {
  data: Sale[]
  meta: {
    total: number
    currentPage: number
    totalPages: number
  }
}

export const getSales = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'date',
  sortOrder: 'asc' | 'desc' = 'desc',
  search: string = ''
): Promise<GetSalesResponse> => {
  const response = await api.get('/sales', {
    params: {
      page,
      limit,
      sortBy,
      sortOrder,
      search
    }
  })
  return response.data
}

export const getSaleById = async (id: string): Promise<Sale> => {
  const response = await api.get(`/sales/${id}`)
  return response.data
}

/**
 * Cancela una venta y revierte stock + caja (si está abierta).
 * El backend devuelve 409 si la caja asociada está cerrada.
 */
export const cancelSale = async (id: string): Promise<Sale> => {
  const response = await api.put(`/sales/${id}/cancel`)
  return response.data
}
