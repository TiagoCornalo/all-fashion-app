import api from './config/axios'
import { ExchangeRate } from '../types/inventory.types'

export const getExchangeRate = async (): Promise<ExchangeRate> => {
  const response = await api.get<ExchangeRate>('/config/exchange-rate')
  return response.data
}

export type RefreshExchangeRateResponse = {
  rate: ExchangeRate
  recalc: {
    recalculated: number
    skipped: number
    rate?: number
    surcharge?: number
    type?: string
    fetchedAt?: string
    reason?: string
  }
}

export const refreshExchangeRate = async (): Promise<RefreshExchangeRateResponse> => {
  const response = await api.post<RefreshExchangeRateResponse>(
    '/config/exchange-rate/refresh'
  )
  return response.data
}
