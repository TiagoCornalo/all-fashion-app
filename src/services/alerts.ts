import api from './config/axios'

export const getAlerts = async (status: 'PENDING' | 'RESOLVED') => {
  const response = await api.get(`/alerts?status=${status}&pageSize=100`)
  return response.data
}

export const resolveAlert = async (alertId: string, note: string) => {
  const response = await api.put(`/alerts/${alertId}/resolve`, {
    resolutionNote: note
  })
  return response.data
}

export const resolveAllAlerts = async (note = 'Cierre manual en bloque.') => {
  const response = await api.put('/alerts/resolve-all', {
    resolutionNote: note
  })
  return response.data
}
