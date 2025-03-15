import api from './config/axios'

export const openRegister = async (initialBalance: number) => {
  const response = await api.post('/cash-registers/open', { initialBalance })
  return response.data
}

export const closeRegister = async (
  id: string,
  actualCash: number,
  notes?: string
) => {
  const response = await api.put(`/cash-registers/${id}/close`, {
    actualCash,
    notes
  })
  return response.data
}

export const getCurrentRegister = async () => {
  const response = await api.get('/cash-registers/current')
  return response.data
}

export const getCashRegisters = async (page: number = 1, limit: number = 5) => {
  const response = await api.get('/cash-registers', {
    params: { page, limit }
  })
  return response.data
}

export const getLastClosedRegister = async () => {
  const response = await api.get('/cash-registers/last-closed')
  return response.data
}
