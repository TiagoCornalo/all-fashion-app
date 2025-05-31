import { CreateDiscount, UpdateDiscount } from '../types/discount.types'
import api from './config/axios'

interface GetDiscountsParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface GetUsageHistoryParams {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getDiscounts = async (params: GetDiscountsParams) => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.search && { search: params.search }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder })
  })

  const response = await api.get(`/promotions?${queryParams}`)
  return response.data
}

export const getDiscountById = async (id: string) => {
  const response = await api.get(`/promotions/${id}`)
  return response.data
}

export const createDiscount = async (discount: CreateDiscount) => {
  const response = await api.post('/promotions', discount)
  return response.data
}

export const updateDiscount = async (id: string, discount: UpdateDiscount) => {
  const response = await api.put(`/promotions/${id}`, discount)
  return response.data
}

export const getPromotionUsageHistory = async (id: string, params: GetUsageHistoryParams = {}) => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.startDate && { startDate: params.startDate }),
    ...(params.endDate && { endDate: params.endDate }),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder })
  })

  const response = await api.get(`/promotions/${id}/usage-history?${queryParams}`)
  return response.data
}
