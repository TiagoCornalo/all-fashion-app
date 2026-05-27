import api from './config/axios'
import {
  InstallmentPlanOption,
  InstallmentFrequency
} from '../types/sale.types'

export type InstallmentPlansResponse = {
  plans: InstallmentPlanOption[]
  defaultFrequency: InstallmentFrequency
}

export const getInstallmentPlans = async (): Promise<InstallmentPlansResponse> => {
  const response = await api.get<InstallmentPlansResponse>(
    '/config/account-payable/plans'
  )
  return response.data
}

export const updateInstallmentPlans = async (
  plans: InstallmentPlanOption[]
): Promise<{ plans: InstallmentPlanOption[] }> => {
  const response = await api.put('/config/account-payable/plans', { plans })
  return response.data
}
