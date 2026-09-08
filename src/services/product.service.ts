import api from './config/axios'
import { Product } from '../types/inventory.types'
import { applyCurrentUsdPrices } from './exchangeRate.service'

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
  const products = Array.isArray(response.data.data) ? response.data.data : []
  return applyCurrentUsdPrices(products)
}
