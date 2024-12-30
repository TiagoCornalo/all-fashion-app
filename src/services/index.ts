import { TableFilters, Product } from '../types/inventory.types'
import api from './config/axios'

/**
 * Obtiene los productos con paginación y filtros
 * @param filters - Filtros y parámetros de paginación
 */
export const fetchProducts = async (filters: TableFilters) => {
  const queryParams = new URLSearchParams({
    page: filters.page.toString(),
    pageSize: filters.pageSize.toString(),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
    ...(filters.search && { search: filters.search }),
    ...Object.entries(filters.filters || {}).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [`filter[${key}]`]: value
      }),
      {}
    )
  })

  const response = await api.get(`/products?${queryParams}`)
  return response.data
}

export const editProduct = async (product: Product) => {
  const response = await api.put(`/products/${product._id}`, product)
  return response.data
}

export const deleteProduct = async (productId: string) => {
  const response = await api.delete(`/products/${productId}`)
  return response.data
}
