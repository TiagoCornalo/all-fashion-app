import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const getPaymentMethodLabel = (method: string) => {
  const methods = {
    CASH: 'Efectivo',
    CREDIT: 'Tarjeta de Crédito',
    DEBIT: 'Tarjeta de Débito',
    TRANSFER: 'Transferencia Bancaria'
  }
  return methods[method as keyof typeof methods] || method
}

export const getSaleStatusLabel = (status: string) => {
  const statuses = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada'
  }
  return statuses[status as keyof typeof statuses] || status
}

export const getSaleStatusColor = (status: string) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100'
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
}
