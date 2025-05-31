import { Order } from '../types/order.types'
import api from './config/axios'

export const createOrder = async (order: Order) => {
  const response = await api.post('/orders', order)
  return response.data
}

export const getOrders = async (
  params: {
    page?: number
    pageSize?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
    supplier?: string
  } = {}
) => {
  const queryParams = new URLSearchParams({
    page: (params.page || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.sortBy && { sortBy: params.sortBy }),
    ...(params.sortOrder && { sortOrder: params.sortOrder }),
    ...(params.search && { search: params.search }),
    ...(params.status && { status: params.status }),
    ...(params.supplier && { supplier: params.supplier })
  })

  const response = await api.get(`/orders?${queryParams}`)
  return response.data
}

export const getOrderById = async (orderId: string) => {
  const response = await api.get(`/orders/${orderId}`)
  return response.data
}

export const updateOrder = async (
  orderId: string,
  orderData: {
    status?: string
    notes?: string
    items?: Array<{
      productId: string
      quantity: number
    }>
  }
) => {
  const response = await api.post(`/orders/${orderId}`, orderData)
  return response.data
}

export const deleteOrder = async (orderId: string) => {
  const response = await api.delete(`/orders/${orderId}`)
  return response.data
}

export const completeOrder = async (orderId: string) => {
  const response = await api.post(`/orders/complete/${orderId}`)
  return response.data
}

export const sendOrder = async (orderId: string) => {
  const response = await api.put(`/orders/send/${orderId}`)
  return response.data
}

export const rejectOrder = async (orderId: string) => {
  const response = await api.put(`/orders/reject/${orderId}`)
  return response.data
}

export const approveOrder = async (orderId: string) => {
  const response = await api.put(`/orders/approve/${orderId}`)
  return response.data
}

export const inTransitOrder = async (orderId: string) => {
  const response = await api.put(`/orders/in-transit/${orderId}`)
  return response.data
}

export const scheduleArrival = async (orderId: string, data: { scheduledDate: string; notes?: string }) => {
  const response = await api.put(`/orders/${orderId}/schedule-arrival`, data)
  return response.data
}

export const getPendingAdminApproval = async () => {
  const response = await api.get('/orders/admin/pending-admin-approval')
  return response.data
}

export const adminApproveOrder = async (orderId: string, data: { approved: boolean; adminNotes?: string }) => {
  const response = await api.post(`/orders/${orderId}/admin-approve`, data)
  return response.data
}