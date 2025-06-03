import { ServiceStatus, ServicePriority, EquipmentType, ServiceCategory } from '../../types/technical-service.types'

// Labels para estados
export const STATUS_LABELS: Record<ServiceStatus, string> = {
  'RECEIVED': 'Recibido',
  'DIAGNOSING': 'En Diagnóstico',
  'WAITING_APPROVAL': 'Esperando Aprobación',
  'APPROVED': 'Aprobado',
  'WAITING_PARTS': 'Esperando Piezas',
  'IN_REPAIR': 'En Reparación',
  'TESTING': 'En Pruebas',
  'COMPLETED': 'Completado',
  'DELIVERED': 'Entregado',
  'CANCELLED': 'Cancelado',
  'WARRANTY_CLAIM': 'Reclamo Garantía'
}

// Labels para prioridades
export const PRIORITY_LABELS: Record<ServicePriority, string> = {
  'LOW': 'Baja',
  'NORMAL': 'Normal',
  'HIGH': 'Alta',
  'URGENT': 'Urgente'
}

// Labels para tipos de equipo
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  'CLIPPER': 'Máquina Cortapelo',
  'TRIMMER': 'Perfiladora',
  'SHAVER': 'Afeitadora',
  'DRYER': 'Secador',
  'STERILIZER': 'Esterilizador',
  'CHAIR': 'Silla',
  'OTHER': 'Otro'
}

// Labels para categorías de templates
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'MAINTENANCE': 'Mantenimiento',
  'REPAIR': 'Reparación',
  'CLEANING': 'Limpieza',
  'BLADE_SERVICE': 'Servicio de Cuchillas',
  'MOTOR_SERVICE': 'Servicio de Motor',
  'ELECTRICAL': 'Eléctrico',
  'CALIBRATION': 'Calibración',
  'WARRANTY': 'Garantía',
  'OTHER': 'Otro'
}

// Estados que permiten ciertas acciones
export const EDITABLE_STATUSES: ServiceStatus[] = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_APPROVAL',
  'APPROVED',
  'WAITING_PARTS',
  'IN_REPAIR',
  'TESTING'
]

export const ACTIVE_STATUSES: ServiceStatus[] = [
  'RECEIVED',
  'DIAGNOSING',
  'WAITING_APPROVAL',
  'APPROVED',
  'WAITING_PARTS',
  'IN_REPAIR',
  'TESTING'
]

export const COMPLETED_STATUSES: ServiceStatus[] = [
  'COMPLETED',
  'DELIVERED',
  'CANCELLED'
]

// Transiciones de estado válidas
export const STATUS_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  'RECEIVED': ['DIAGNOSING', 'CANCELLED'],
  'DIAGNOSING': ['WAITING_APPROVAL', 'CANCELLED'],
  'WAITING_APPROVAL': ['APPROVED', 'CANCELLED'],
  'APPROVED': ['WAITING_PARTS', 'IN_REPAIR', 'CANCELLED'],
  'WAITING_PARTS': ['IN_REPAIR', 'CANCELLED'],
  'IN_REPAIR': ['TESTING', 'WAITING_PARTS', 'CANCELLED'],
  'TESTING': ['COMPLETED', 'IN_REPAIR'],
  'COMPLETED': ['DELIVERED', 'WARRANTY_CLAIM'],
  'DELIVERED': ['WARRANTY_CLAIM'],
  'CANCELLED': [],
  'WARRANTY_CLAIM': ['RECEIVED', 'COMPLETED']
}

// Opciones para filtros
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as ServiceStatus,
  label
}))

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value: value as ServicePriority,
  label
}))

export const EQUIPMENT_TYPE_OPTIONS = Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => ({
  value: value as EquipmentType,
  label
}))

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value: value as ServiceCategory,
  label
}))

// Configuración de paginación
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

// Marcas comunes de equipos
export const COMMON_BRANDS = [
  'WAHL',
  'OSTER',
  'ANDIS',
  'BABYLISS',
  'REMINGTON',
  'PHILIPS',
  'BRAUN',
  'PANASONIC',
  'GAMMA+',
  'KEMEI'
]

// Métodos de pago
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'DEBIT', label: 'Débito' },
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'MP', label: 'Mercado Pago' }
]

// Configuración de tiempo estimado
export const TIME_UNITS = [
  { value: 'MINUTES', label: 'Minutos' },
  { value: 'HOURS', label: 'Horas' },
  { value: 'DAYS', label: 'Días' },
  { value: 'WEEKS', label: 'Semanas' }
]

// Frecuencias de problemas
export const FREQUENCY_OPTIONS = [
  { value: 'ALWAYS', label: 'Siempre' },
  { value: 'SOMETIMES', label: 'A veces' },
  { value: 'RARELY', label: 'Rara vez' },
  { value: 'ONCE', label: 'Una vez' }
]

// Tipos de documento
export const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIT', label: 'CUIT' },
  { value: 'OTHER', label: 'Otro' }
]

// Configuración de dashboard
export const DASHBOARD_REFRESH_INTERVAL = 30000 // 30 segundos

// Configuración de notificaciones
export const OVERDUE_WARNING_DAYS = 1
export const WARRANTY_EXPIRING_DAYS = 7
