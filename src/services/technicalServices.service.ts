import api from './config/axios'

export type TechnicalServiceStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'WAITING_PARTS'
  | 'IN_REPAIR'
  | 'TESTING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'WARRANTY_CLAIM'

export type EquipmentType =
  | 'CLIPPER'
  | 'TRIMMER'
  | 'SHAVER'
  | 'DRYER'
  | 'STERILIZER'
  | 'CHAIR'
  | 'OTHER'

export interface TechnicalService {
  _id: string
  serviceNumber: string
  customer: {
    name: string
    documentType?: 'DNI' | 'CUIT' | 'OTHER'
    documentNumber?: string
    phone: string
    email?: string
    address?: string
  }
  equipment: {
    type: EquipmentType
    brand: string
    model: string
    serialNumber?: string
    color?: string
    accessories?: string[]
  }
  customerReport: {
    description: string
    whenStarted?: string
    frequency?: 'ALWAYS' | 'SOMETIMES' | 'RARELY' | 'ONCE'
    customerNotes?: string
  }
  technicalDiagnosis?: {
    initialInspection?: string
    diagnosis?: string
    rootCause?: string
    repairability?: 'REPAIRABLE' | 'NOT_REPAIRABLE' | 'PENDING_EVALUATION'
  }
  status: TechnicalServiceStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  assignedTechnician?: {
    _id: string
    name: string
    email?: string
  } | string
  partsUsed: Array<{
    _id: string
    product?: {
      _id: string
      name: string
      code: string
      price: number
      stock?: number
    } | string | null
    quantity: number
    unitPrice: number
    subtotal: number
    notes?: string
  }>
  costs: {
    laborCost: number
    partsCost: number
    additionalCosts: number
    totalCost: number
    estimatedCost?: number
    customerApprovedAmount?: number
  }
  dates: {
    receivedAt: string
    estimatedDelivery?: string
    repairCompletedAt?: string
    deliveredAt?: string
  }
  payment: {
    isPaid: boolean
    paymentMethod?: 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'MP'
    paidAmount: number
    paidAt?: string
    payments?: Array<{
      _id: string
      paymentMethod: string
      amount: number
      notes?: string
      paidAt: string
      receivedBy?: { name: string } | string
    }>
  }
  summary?: {
    totalCost: number
    isPaid: boolean
    isOverdue: boolean
    daysSinceReceived: number
  }
}

export interface TechnicalServicesResponse {
  data: TechnicalService[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    availableStatuses: TechnicalServiceStatus[]
  }
}

export interface CreateTechnicalServiceData {
  customer: TechnicalService['customer']
  equipment: TechnicalService['equipment']
  customerReport: TechnicalService['customerReport']
  assignedTechnician?: string
  priority?: TechnicalService['priority']
  estimatedDelivery?: string
  notes?: {
    technicalNotes?: string
    customerInstructions?: string
    internalNotes?: string
  }
}

export interface ProductSearchResult {
  _id: string
  name: string
  code: string
  stock: number
  price: number
}

export const getTechnicalServices = async (params: Record<string, unknown> = {}) => {
  const response = await api.get<TechnicalServicesResponse>('/technical-services', { params })
  return response.data
}

export const getTechnicalServiceById = async (id: string) => {
  const response = await api.get<{ data: TechnicalService; meta: Record<string, unknown> }>(`/technical-services/${id}`)
  return response.data
}

export const getTechnicalServiceTechnicians = async (): Promise<Array<{ _id: string; name: string; email: string; role: string }>> => {
  const response = await api.get('/technical-services/technicians')
  return response.data.data || []
}

export const createTechnicalService = async (data: CreateTechnicalServiceData) => {
  const response = await api.post<{ data: TechnicalService }>('/technical-services', data)
  return response.data.data
}

export const updateTechnicalService = async (id: string, data: Partial<CreateTechnicalServiceData> & Record<string, unknown>) => {
  const response = await api.put<{ data: TechnicalService }>(`/technical-services/${id}`, data)
  return response.data.data
}

export const changeTechnicalServiceStatus = async (id: string, newStatus: TechnicalServiceStatus, notes?: string) => {
  const response = await api.put(`/technical-services/${id}/status`, { newStatus, notes })
  return response.data
}

export const addTechnicalServicePart = async (
  id: string,
  data: { productId: string; quantity: number; unitPrice?: number; notes?: string }
) => {
  const response = await api.post(`/technical-services/${id}/parts`, data)
  return response.data
}

export const removeTechnicalServicePart = async (id: string, partId: string) => {
  const response = await api.delete(`/technical-services/${id}/parts/${partId}`)
  return response.data
}

export const registerTechnicalServicePayment = async (
  id: string,
  data: { paymentMethod: string; amount: number; notes?: string; registerInCash?: boolean }
) => {
  const response = await api.post(`/technical-services/${id}/payment`, data)
  return response.data
}

export const searchServiceProducts = async (search: string): Promise<ProductSearchResult[]> => {
  const response = await api.get('/products', { params: { search, pageSize: 12 } })
  return response.data.data || []
}
