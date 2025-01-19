import api from './config/axios'
import { Product } from '../types/inventory.types'

export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await api.get(`/api/products?search=${query}&pageSize=5`)
  return response.data.data
}