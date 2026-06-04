import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExchangeRate,
  refreshExchangeRate
} from '../services/exchangeRate.service'
import { USDRateType } from '../types/inventory.types'

const queryKey = (type: USDRateType) => ['exchange-rate', type]

export const useExchangeRate = (type: USDRateType = 'blue') => {
  return useQuery({
    queryKey: queryKey(type),
    queryFn: () => getExchangeRate(type),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export const useRefreshExchangeRate = (type: USDRateType = 'blue') => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => refreshExchangeRate(type),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey(type), data.rate)
      queryClient.invalidateQueries({ queryKey: ['exchange-rate'] })
    }
  })
}
