import api from './config/axios'

export const getAlerts = async (status: 'PENDING' | 'RESOLVED') => {
  const response = await api.get(`/alerts?status=${status}`)
  return response.data
}

export const resolveAlert = async (alertId: string, note: string) => {
  const response = await api.put(`/alerts/${alertId}/resolve`, { note })
  return response.data
}
