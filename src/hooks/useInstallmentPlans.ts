import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInstallmentPlans,
  updateInstallmentPlans
} from '../services/installmentPlans.service'
import { InstallmentPlanOption } from '../types/sale.types'

const QUERY_KEY = ['installment-plans']

export const useInstallmentPlans = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: getInstallmentPlans,
    staleTime: 5 * 60 * 1000
  })

export const useUpdateInstallmentPlans = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (plans: InstallmentPlanOption[]) => updateInstallmentPlans(plans),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })
}
