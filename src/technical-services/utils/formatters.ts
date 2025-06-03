import { TechnicalService, ServiceStatus, Equipment } from '../../types/technical-service.types'
import { formatCurrency } from '../../utils'

/**
 * Formatea la información del equipo en una cadena legible
 */
export const formatEquipmentInfo = (equipment: Equipment): string => {
  const parts = [equipment.brand, equipment.model]
  if (equipment.serialNumber) {
    parts.push(`S/N: ${equipment.serialNumber}`)
  }
  return parts.join(' ')
}

/**
 * Formatea el tiempo transcurrido desde una fecha de manera legible
 */
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays === 0) {
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return diffInMinutes < 1 ? 'Hace un momento' : `Hace ${diffInMinutes} min`
    }
    return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`
  }

  if (diffInDays === 1) {
    return 'Hace 1 día'
  }

  if (diffInDays < 30) {
    return `Hace ${diffInDays} días`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) {
    return 'Hace 1 mes'
  }

  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} meses`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `Hace ${diffInYears} año${diffInYears !== 1 ? 's' : ''}`
}

/**
 * Formatea el estado del servicio en texto legible
 */
export const formatServiceStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'RECEIVED': 'Recibido',
    'DIAGNOSING': 'Diagnosticando',
    'WAITING_APPROVAL': 'Esperando Aprobación',
    'APPROVED': 'Aprobado',
    'WAITING_PARTS': 'Esperando Piezas',
    'IN_REPAIR': 'En Reparación',
    'TESTING': 'Probando',
    'COMPLETED': 'Completado',
    'DELIVERED': 'Entregado',
    'CANCELLED': 'Cancelado',
    'WARRANTY_CLAIM': 'Garantía'
  }
  return statusMap[status] || status
}

/**
 * Formatea la prioridad del servicio en texto legible
 */
export const formatServicePriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'LOW': 'Baja',
    'NORMAL': 'Normal',
    'HIGH': 'Alta',
    'URGENT': 'Urgente'
  }
  return priorityMap[priority] || priority
}

/**
 * Formatea el tipo de equipo en texto legible
 */
export const formatEquipmentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'CLIPPER': 'Máquina de Cortar',
    'TRIMMER': 'Recortadora',
    'SHAVER': 'Afeitadora',
    'DRYER': 'Secador',
    'STERILIZER': 'Esterilizador',
    'CHAIR': 'Silla',
    'OTHER': 'Otro'
  }
  return typeMap[type] || type
}

/**
 * Formatea el método de pago en texto legible
 */
export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    'CASH': 'Efectivo',
    'CREDIT_CARD': 'Tarjeta de Crédito',
    'DEBIT_CARD': 'Tarjeta de Débito',
    'TRANSFER': 'Transferencia',
    'CHECK': 'Cheque',
    'OTHER': 'Otro'
  }
  return methodMap[method] || method
}

/**
 * Calcula y formatea el progreso del servicio como porcentaje
 */
export const calculateServiceProgress = (status: string): {
  percentage: number
  label: string
} => {
  const progressMap: Record<string, { percentage: number; label: string }> = {
    'RECEIVED': { percentage: 10, label: 'Recibido' },
    'DIAGNOSING': { percentage: 25, label: 'Diagnosticando' },
    'WAITING_APPROVAL': { percentage: 40, label: 'Esperando Aprobación' },
    'APPROVED': { percentage: 50, label: 'Aprobado' },
    'WAITING_PARTS': { percentage: 60, label: 'Esperando Piezas' },
    'IN_REPAIR': { percentage: 75, label: 'En Reparación' },
    'TESTING': { percentage: 90, label: 'Probando' },
    'COMPLETED': { percentage: 95, label: 'Completado' },
    'DELIVERED': { percentage: 100, label: 'Entregado' },
    'CANCELLED': { percentage: 0, label: 'Cancelado' },
    'WARRANTY_CLAIM': { percentage: 100, label: 'En Garantía' }
  }

  return progressMap[status] || { percentage: 0, label: 'Desconocido' }
}

/**
 * Determina si un servicio está vencido
 */
export const isServiceOverdue = (estimatedDelivery?: string | Date, status?: string): boolean => {
  if (!estimatedDelivery || status === 'DELIVERED' || status === 'CANCELLED') {
    return false
  }

  const now = new Date()
  const deliveryDate = new Date(estimatedDelivery)

  return now > deliveryDate
}

/**
 * Calcula los días de retraso de un servicio
 */
export const calculateOverdueDays = (estimatedDelivery?: string | Date, status?: string): number => {
  if (!isServiceOverdue(estimatedDelivery, status)) {
    return 0
  }

  const now = new Date()
  const deliveryDate = new Date(estimatedDelivery!)
  const diffInMs = now.getTime() - deliveryDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffInDays)
}

/**
 * Formatea una lista de síntomas en texto legible
 */
export const formatSymptoms = (symptoms: string[]): string => {
  if (symptoms.length === 0) {
    return 'Sin síntomas reportados'
  }

  if (symptoms.length === 1) {
    return symptoms[0]
  }

  if (symptoms.length === 2) {
    return symptoms.join(' y ')
  }

  return `${symptoms.slice(0, -1).join(', ')} y ${symptoms[symptoms.length - 1]}`
}

/**
 * Trunca un texto a una longitud específica agregando puntos suspensivos
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Formatea la frecuencia de un problema
 */
export const formatFrequency = (frequency: string): string => {
  const frequencyMap: Record<string, string> = {
    'ALWAYS': 'Siempre',
    'FREQUENTLY': 'Frecuentemente',
    'SOMETIMES': 'A veces',
    'RARELY': 'Raramente',
    'ONCE': 'Una vez'
  }
  return frequencyMap[frequency] || frequency
}

// Formatear duración estimada
export const formatEstimatedTime = (time: {
  value: number
  unit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'
}): string => {
  const units = {
    'MINUTES': 'minuto',
    'HOURS': 'hora',
    'DAYS': 'día',
    'WEEKS': 'semana'
  }

  const unit = units[time.unit]
  return `${time.value} ${unit}${time.value !== 1 ? 's' : ''}`
}

// Formatear rango de tiempo
export const formatTimeRange = (min: number, max: number, unit: string): string => {
  const unitLabels = {
    'MINUTES': 'min',
    'HOURS': 'h',
    'DAYS': 'd',
    'WEEKS': 'sem'
  }

  const shortUnit = unitLabels[unit as keyof typeof unitLabels] || unit.toLowerCase()

  if (min === max) {
    return `${min}${shortUnit}`
  }
  return `${min}-${max}${shortUnit}`
}

// Calcular y formatear tiempo de servicio
export const formatServiceDuration = (service: TechnicalService): string => {
  const startDate = new Date(service.dates.receivedAt)
  const endDate = service.dates.deliveredAt
    ? new Date(service.dates.deliveredAt)
    : new Date()

  const diffMs = endDate.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (diffDays > 0) {
    return diffHours > 0
      ? `${diffDays}d ${diffHours}h`
      : `${diffDays} día${diffDays !== 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${diffMinutes} min`
  }
}

// Formatear estado de vencimiento
export const formatOverdueStatus = (service: TechnicalService): {
  isOverdue: boolean
  daysOverdue: number
  message: string
} => {
  if (!service.dates.estimatedDelivery || service.dates.deliveredAt) {
    return { isOverdue: false, daysOverdue: 0, message: '' }
  }

  const now = new Date()
  const estimatedDate = new Date(service.dates.estimatedDelivery)
  const diffMs = now.getTime() - estimatedDate.getTime()
  const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysOverdue > 0) {
    return {
      isOverdue: true,
      daysOverdue,
      message: `Vencido hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''}`
    }
  } else if (daysOverdue >= -1) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      message: 'Vence hoy'
    }
  } else {
    const daysLeft = Math.abs(daysOverdue)
    return {
      isOverdue: false,
      daysOverdue: 0,
      message: `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}`
    }
  }
}

// Formatear información de garantía
export const formatWarrantyInfo = (service: TechnicalService): {
  hasActiveWarranty: boolean
  daysLeft: number
  message: string
} => {
  if (!service.serviceWarranty.warrantyExpires) {
    return {
      hasActiveWarranty: false,
      daysLeft: 0,
      message: 'Sin garantía activa'
    }
  }

  const now = new Date()
  const warrantyExpires = new Date(service.serviceWarranty.warrantyExpires)
  const diffMs = warrantyExpires.getTime() - now.getTime()
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (daysLeft > 0) {
    return {
      hasActiveWarranty: true,
      daysLeft,
      message: `${daysLeft} día${daysLeft !== 1 ? 's' : ''} de garantía`
    }
  } else {
    return {
      hasActiveWarranty: false,
      daysLeft: 0,
      message: 'Garantía vencida'
    }
  }
}

// Formatear resumen de costos
export const formatCostSummary = (costs: {
  laborCost: number
  partsCost: number
  additionalCosts: number
  totalCost: number
}): string => {
  const parts = []

  if (costs.laborCost > 0) {
    parts.push(`Mano de obra: ${formatCurrency(costs.laborCost)}`)
  }

  if (costs.partsCost > 0) {
    parts.push(`Piezas: ${formatCurrency(costs.partsCost)}`)
  }

  if (costs.additionalCosts > 0) {
    parts.push(`Adicionales: ${formatCurrency(costs.additionalCosts)}`)
  }

  return parts.length > 0
    ? `${parts.join(' + ')} = ${formatCurrency(costs.totalCost)}`
    : formatCurrency(costs.totalCost)
}

// Formatear información del cliente
export const formatCustomerInfo = (customer: {
  name: string
  phone: string
  documentType?: string
  documentNumber?: string
}): string => {
  let info = customer.name

  if (customer.phone) {
    info += ` - ${customer.phone}`
  }

  if (customer.documentType && customer.documentNumber) {
    info += ` (${customer.documentType}: ${customer.documentNumber})`
  }

  return info
}

// Formatear ID de servicio corto
export const formatServiceId = (serviceNumber: string): string => {
  // Extraer los últimos 6 caracteres para mostrar ID corto
  return serviceNumber.length > 6
    ? `...${serviceNumber.slice(-6)}`
    : serviceNumber
}

// Formatear progreso del servicio
export const formatServiceProgress = (status: ServiceStatus): {
  step: number
  totalSteps: number
  percentage: number
  label: string
} => {
  const statusSteps = {
    'RECEIVED': { step: 1, label: 'Recibido' },
    'DIAGNOSING': { step: 2, label: 'Diagnosticando' },
    'WAITING_APPROVAL': { step: 3, label: 'Esperando aprobación' },
    'APPROVED': { step: 4, label: 'Aprobado' },
    'WAITING_PARTS': { step: 5, label: 'Esperando piezas' },
    'IN_REPAIR': { step: 6, label: 'En reparación' },
    'TESTING': { step: 7, label: 'Probando' },
    'COMPLETED': { step: 8, label: 'Completado' },
    'DELIVERED': { step: 9, label: 'Entregado' },
    'CANCELLED': { step: 0, label: 'Cancelado' },
    'WARRANTY_CLAIM': { step: 2, label: 'Reclamo garantía' }
  }

  const totalSteps = 9
  const current = statusSteps[status]
  const percentage = current.step === 0 ? 0 : Math.round((current.step / totalSteps) * 100)

  return {
    step: current.step,
    totalSteps,
    percentage,
    label: current.label
  }
}

// Generar resumen de actividad reciente
export const formatRecentActivity = (statusHistory: Array<{
  status: ServiceStatus
  changedAt: Date
  changedBy: string
  notes?: string
}>): string => {
  if (statusHistory.length === 0) return 'Sin actividad reciente'

  const latest = statusHistory[statusHistory.length - 1]
  const timeAgo = formatTimeAgo(latest.changedAt)

  return `${latest.status.replace('_', ' ').toLowerCase()} - ${timeAgo}`
}

// Formatear estadísticas de técnico
export const formatTechnicianStats = (stats: {
  completedServices: number
  totalRevenue: number
  avgCompletionDays: number | null
}): string => {
  const parts = [`${stats.completedServices} servicios`]

  if (stats.totalRevenue > 0) {
    parts.push(formatCurrency(stats.totalRevenue))
  }

  if (stats.avgCompletionDays) {
    parts.push(`${Math.round(stats.avgCompletionDays)}d promedio`)
  }

  return parts.join(' • ')
}