import api from './config/axios'

export const openRegister = async (initialBalance: number) => {
  const response = await api.post('/cash-registers/open', { initialBalance })
  return response.data
}

export type ReconciliationLine = {
  method: string
  expected: number
  actual: number
  diff: number
  expectedCount: number
  actualCount: number
  matches: boolean
}

export type ReconciliationResponse = {
  registerId: string
  status: 'OPEN' | 'CLOSED'
  paymentBreakdown: ReconciliationLine[]
  hasDiscrepancy: boolean
  salesCount: number
  cancelledCount: number
}

export const getReconciliation = async (id: string): Promise<ReconciliationResponse> => {
  const response = await api.get(`/cash-registers/${id}/reconciliation`)
  return response.data
}

export const closeRegister = async (
  id: string,
  payload: {
    actualCash: number
    notes?: string
    forceClose?: boolean
    discrepancyNote?: string
  }
) => {
  const response = await api.put(`/cash-registers/${id}/close`, payload)
  return response.data
}

export const reopenRegister = async (id: string, reason: string) => {
  const response = await api.put(`/cash-registers/${id}/reopen`, { reason })
  return response.data
}

export const getCurrentRegister = async () => {
  const response = await api.get('/cash-registers/current')
  return response.data
}

export const getCashRegisters = async (
  page: number = 1,
  limit: number = 5,
  sortBy: string = 'date',
  sortOrder: 'asc' | 'desc' = 'desc'
) => {
  const response = await api.get('/cash-registers', {
    params: { page, limit, sortBy, sortOrder }
  })
  return response.data
}

export const getLastClosedRegister = async () => {
  const response = await api.get('/cash-registers/last-closed')
  return response.data
}

export const getCashRegisterById = async (id: string) => {
  const response = await api.get(`/cash-registers/${id}`)
  return response.data
}

export const deposit = async (id: string, amount: number, notes?: string) => {
  const response = await api.post(`/cash-registers/${id}/deposit`, {
    amount,
    notes
  })
  return response.data
}

export const withdraw = async (id: string, amount: number, notes?: string) => {
  const response = await api.post(`/cash-registers/${id}/withdrawal`, {
    amount,
    notes
  })
  return response.data
}
