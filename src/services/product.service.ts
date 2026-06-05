import api from './config/axios'
import { Product } from '../types/inventory.types'

export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await api.get('/products', {
    params: {
      search: query,
      page: 1,
      pageSize: 100,
      sortBy: 'name',
      sortOrder: 'asc'
    }
  })
  return Array.isArray(response.data.data) ? response.data.data : []
}
