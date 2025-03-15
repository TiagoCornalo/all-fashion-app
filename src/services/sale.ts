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
