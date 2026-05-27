import api from './config/axios'
import { Bank } from '../types/sale.types'

export type BanksListResponse = {
  data: Bank[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export const getBanks = async (params: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
} = {}): Promise<BanksListResponse> => {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('pageSize', String(params.pageSize))
  if (params.search) qs.set('search', params.search)
  if (params.isActive !== undefined) qs.set('isActive', String(params.isActive))
  const response = await api.get<BanksListResponse>(`/banks?${qs.toString()}`)
  return response.data
}

export const getActiveBanks = async (): Promise<Bank[]> => {
  const response = await api.get<Bank[]>('/banks/active')
  return response.data
}

export type BankPayload = {
  name: string
  notes?: string
  surcharges?: { DEBIT?: number; CREDIT?: number }
  isActive?: boolean
}

export const createBank = async (payload: BankPayload): Promise<Bank> => {
  const response = await api.post<Bank>('/banks', payload)
  return response.data
}

export const updateBank = async (
  id: string,
  payload: Partial<BankPayload>
): Promise<Bank> => {
  const response = await api.put<Bank>(`/banks/${id}`, payload)
  return response.data
}

export const deactivateBank = async (id: string): Promise<void> => {
  await api.delete(`/banks/${id}`)
}
