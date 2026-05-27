import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBanks,
  getActiveBanks,
  createBank,
  updateBank,
  deactivateBank,
  BankPayload
} from '../services/banks.service'

const ACTIVE_BANKS_KEY = ['banks', 'active']
const ALL_BANKS_KEY = ['banks']

export const useActiveBanks = () =>
  useQuery({
    queryKey: ACTIVE_BANKS_KEY,
    queryFn: getActiveBanks,
    staleTime: 5 * 60 * 1000
  })

export const useBanksList = (params: Parameters<typeof getBanks>[0]) =>
  useQuery({
    queryKey: [...ALL_BANKS_KEY, params],
    queryFn: () => getBanks(params)
  })

export const useCreateBank = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BankPayload) => createBank(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALL_BANKS_KEY })
      qc.invalidateQueries({ queryKey: ACTIVE_BANKS_KEY })
    }
  })
}

export const useUpdateBank = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BankPayload> }) =>
      updateBank(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALL_BANKS_KEY })
      qc.invalidateQueries({ queryKey: ACTIVE_BANKS_KEY })
    }
  })
}

export const useDeactivateBank = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateBank(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALL_BANKS_KEY })
      qc.invalidateQueries({ queryKey: ACTIVE_BANKS_KEY })
    }
  })
}
