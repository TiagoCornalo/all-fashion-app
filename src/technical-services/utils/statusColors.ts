import { ServiceStatus, ServicePriority } from '../../types/technical-service.types'

// Colores para estados
export const getStatusColor = (status: ServiceStatus): {
  bg: string
  text: string
  border: string
} => {
  const colors = {
    'RECEIVED': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    'DIAGNOSING': {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200'
    },
    'WAITING_APPROVAL': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    'APPROVED': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    'WAITING_PARTS': {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200'
    },
    'IN_REPAIR': {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      border: 'border-indigo-200'
    },
    'TESTING': {
      bg: 'bg-cyan-100',
      text: 'text-cyan-800',
      border: 'border-cyan-200'
    },
    'COMPLETED': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200'
    },
    'DELIVERED': {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200'
    },
    'CANCELLED': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    },
    'WARRANTY_CLAIM': {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200'
    }
  }

  return colors[status] || colors['RECEIVED']
}

// Colores para prioridades
export const getPriorityColor = (priority: ServicePriority): {
  bg: string
  text: string
  border: string
} => {
  const colors = {
    'LOW': {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200'
    },
    'NORMAL': {
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    'HIGH': {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    'URGENT': {
      bg: 'bg-red-100',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  }

  return colors[priority] || colors['NORMAL']
}

// Colores para indicadores de progreso
export const getProgressColor = (status: ServiceStatus): string => {
  const progressMap = {
    'RECEIVED': 'bg-blue-500',
    'DIAGNOSING': 'bg-orange-500',
    'WAITING_APPROVAL': 'bg-yellow-500',
    'APPROVED': 'bg-green-500',
    'WAITING_PARTS': 'bg-purple-500',
    'IN_REPAIR': 'bg-indigo-500',
    'TESTING': 'bg-cyan-500',
    'COMPLETED': 'bg-emerald-500',
    'DELIVERED': 'bg-gray-500',
    'CANCELLED': 'bg-red-500',
    'WARRANTY_CLAIM': 'bg-amber-500'
  }

  return progressMap[status] || 'bg-gray-300'
}

// Porcentaje de progreso basado en el estado
export const getProgressPercentage = (status: ServiceStatus): number => {
  const progressMap = {
    'RECEIVED': 10,
    'DIAGNOSING': 20,
    'WAITING_APPROVAL': 35,
    'APPROVED': 45,
    'WAITING_PARTS': 50,
    'IN_REPAIR': 70,
    'TESTING': 85,
    'COMPLETED': 95,
    'DELIVERED': 100,
    'CANCELLED': 0,
    'WARRANTY_CLAIM': 15
  }

  return progressMap[status] || 0
}

// Determinar si un estado es crítico o requiere atención
export const isStatusCritical = (status: ServiceStatus): boolean => {
  return ['WAITING_APPROVAL', 'WAITING_PARTS', 'WARRANTY_CLAIM'].includes(status)
}

// Determinar si una prioridad es alta
export const isPriorityHigh = (priority: ServicePriority): boolean => {
  return ['HIGH', 'URGENT'].includes(priority)
}

// Obtener color de texto para contraste
export const getContrastTextColor = (backgroundColor: string): string => {
  const lightBackgrounds = [
    'bg-gray-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100',
    'bg-red-100', 'bg-purple-100', 'bg-orange-100', 'bg-cyan-100',
    'bg-emerald-100', 'bg-indigo-100', 'bg-amber-100'
  ]

  return lightBackgrounds.includes(backgroundColor) ? 'text-gray-900' : 'text-white'
}