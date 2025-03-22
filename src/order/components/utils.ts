import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const getOrderStatusLabel = (status: string) => {
  const statuses = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    PROCESSING: 'En proceso',
    DELIVERED: 'Entregada'
  }
  return statuses[status as keyof typeof statuses] || status
}

export const getOrderStatusColor = (status: string) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-purple-100 text-purple-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100'
}

export const getOrderSourceLabel = (source: string) => {
  const sources = {
    AUTO: 'Automático',
    MANUAL: 'Manual',
    ALERT: 'Por alerta'
  }
  return sources[source as keyof typeof sources] || source
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
}

// Función para formatear las notas y extraer los logs
export const extractLogsFromNotes = (notes: string) => {
  if (!notes) return []

  // Las notas que contienen logs del sistema tienen un formato específico
  // [Sistema] Acción... fecha
  return notes
    .split('\n')
    .filter((line) => line.trim().startsWith('[Sistema]'))
    .map((line) => ({
      content: line.trim(),
      timestamp: extractTimestampFromLog(line)
    }))
}

// Extraer la fecha/hora de una línea de log
const extractTimestampFromLog = (logLine: string) => {
  // Buscar patrones como "DD/MM/YYYY, HH:MM:SS"
  const matches = logLine.match(
    /(\d{1,2}\/\d{1,2}\/\d{4},\s\d{1,2}:\d{2}:\d{2})/
  )
  return matches ? matches[1] : ''
}
