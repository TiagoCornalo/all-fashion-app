import { TableFilters, Product, CreateProduct } from '../types/inventory.types'
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

export const addProduct = async (product: CreateProduct) => {
  const response = await api.post('/products', product)
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

export const bulkDeleteProducts = async (productIds: string[]) => {
  const response = await api.delete(`/products/bulk`, {
    data: { ids: productIds }
  })
  return response.data
}

export type BulkImportReport = {
  dryRun: boolean
  updateStock: boolean
  sheetUsed: string
  totalRowsRead: number
  productsParsed: number
  productsCreated: number
  productsUpdated: number
  productsWithUSD: number
  productsARSOnly: number
  productsUSDBlue?: number
  productsUSDOfficial?: number
  productsWithoutSupplier?: number
  suppliersInExcel: number
  suppliersCreated: number
  suppliersMatched: number
  duplicatesInExcel: Array<{ code: string; kept: number; discarded: number }>
  skipped: Array<{ row: number; reason: string }>
  errors: Array<{ row: number; code: string; error: string }>
}

export const bulkImportProductsFromExcel = async (
  file: File,
  options: { dryRun?: boolean; updateStock?: boolean } = {}
): Promise<BulkImportReport> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('updateStock', String(options.updateStock ?? true))
  const params = new URLSearchParams()
  if (options.dryRun) params.set('dryRun', 'true')
  if (options.updateStock === false) params.set('updateStock', 'false')
  const response = await api.post<BulkImportReport>(
    `/products/bulk-import-excel${params.toString() ? `?${params}` : ''}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return response.data
}

export const findProductsBySupplier = async (
  supplierId: string,
  params: {
    page?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    minStock?: number
    maxStock?: number
    minPrice?: number
    maxPrice?: number
    category?: string
    status?: string
  } = {}
) => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.minStock !== undefined && {
      minStock: params.minStock.toString()
    }),
    ...(params.maxStock !== undefined && {
      maxStock: params.maxStock.toString()
    }),
    ...(params.minPrice !== undefined && {
      minPrice: params.minPrice.toString()
    }),
    ...(params.maxPrice !== undefined && {
      maxPrice: params.maxPrice.toString()
    }),
    ...(params.category && { category: params.category }),
    ...(params.status && { status: params.status })
  })

  const response = await api.get(
    `/products/supplier/${supplierId}?${queryParams}`
  )
  return response.data
}
