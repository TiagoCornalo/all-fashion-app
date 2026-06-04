import api from './config/axios'
import { ExchangeRate, USDRateType } from '../types/inventory.types'

export const getExchangeRate = async (
  type: USDRateType = 'blue'
): Promise<ExchangeRate> => {
  const response = await api.get<ExchangeRate>('/config/exchange-rate', {
    params: { type }
  })
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
    byType?: Record<
      string,
      {
        recalculated: number
        rate: number
        surcharge: number
        fetchedAt: string
      }
    >
    fetchedAt?: string
    reason?: string
  }
}

export const refreshExchangeRate = async (
  type: USDRateType = 'blue'
): Promise<RefreshExchangeRateResponse> => {
  const response = await api.post<RefreshExchangeRateResponse>(
    '/config/exchange-rate/refresh',
    { type }
  )
  return response.data
}
