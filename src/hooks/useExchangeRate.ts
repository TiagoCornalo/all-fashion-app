import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExchangeRate,
  refreshExchangeRate
} from '../services/exchangeRate.service'

const QUERY_KEY = ['exchange-rate']

export const useExchangeRate = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getExchangeRate,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export const useRefreshExchangeRate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshExchangeRate,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data.rate)
    }
  })
}
