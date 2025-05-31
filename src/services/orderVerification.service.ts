import api from './config/axios'

// Types para el flujo de verificación
export interface ScheduledOrder {
  _id: string
  supplier: {
    name: string
    contact?: string
  }
  items: Array<{
    product: {
      _id?: string
      name: string
      code: string
    }
    quantity: number
  }>
  scheduledArrivalDate: string
  receptionStatus: string
  totalValue?: number // Solo visible para admin
}

export interface ArrivedOrder extends ScheduledOrder {
  actualArrivalDate: string
  confirmedArrivalBy: {
    name: string
  }
  employeeVerification?: {
    verifiedBy: {
      name: string
    }
    verificationDate: string
    allCorrect: boolean
    issues: Array<{
      product: string
      expectedQuantity: number
      receivedQuantity: number
      notes?: string
    }>
    notes?: string
  }
}

export interface VerifiedOrder extends ArrivedOrder {
  status: string
  verifiedAt: string
  employeeVerification: {
    verifiedBy: {
      name: string
    }
    verificationDate: string
    allCorrect: boolean
    issues: Array<{
      product: string
      expectedQuantity: number
      receivedQuantity: number
      notes?: string
    }>
    notes?: string
  }
  adminApproval?: {
    approvedBy: {
      name: string
    }
    approvalDate: string
    approved: boolean
    adminNotes?: string
  }
}

export interface VerificationIssue {
  productId: string
  expectedQuantity: number
  receivedQuantity: number
  notes?: string
}

export interface VerificationData {
  allCorrect: boolean
  issues: VerificationIssue[]
  notes?: string
}

export interface AdminApprovalData {
  approved: boolean
  adminNotes?: string
}

export interface OrdersResponse<T> {
  data: T[]
  meta: {
    total: number
    page?: number
    pageSize?: number
    totalPages?: number
    date?: string
    userRole: string
    isAnonymousView: boolean
    lastUpdated?: string
    notifications?: {
      socketEvents: string[]
      message: string
    }
    statistics?: {
      totalVerified: number
      statusBreakdown: Record<string, number>
      filteredResults: number
      unfilteredTotal: number
    }
    appliedFilters?: Record<string, unknown>
    filterInfo?: {
      description: string
      note: string
      timezoneInfo: {
        clientTimezone: string
        serverTimezone: string
        note: string
      }
    }
  }
}

export interface VerifiedOrdersFilters {
  page?: number
  pageSize?: number
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  supplier?: string
  dateFrom?: string
  dateTo?: string
  timezone?: string
}

/**
 * Servicio para manejar el flujo de verificación de pedidos
 */
class OrderVerificationService {
  /**
   * Obtener pedidos programados para llegar hoy
   */
  async getScheduledForToday(): Promise<OrdersResponse<ScheduledOrder>> {
    const response = await api.get('/orders/scheduled-for-today')
    return response.data
  }

  /**
   * Confirmar que un pedido llegó físicamente
   */
  async confirmPhysicalArrival(orderId: string, notes?: string): Promise<{ message: string; order: Record<string, unknown> }> {
    const response = await api.post(`/orders/${orderId}/confirm-physical-arrival`, {
      notes
    })
    return response.data
  }

  /**
   * Obtener pedidos que llegaron y están pendientes de verificación
   */
  async getArrivedPendingVerification(): Promise<OrdersResponse<ArrivedOrder>> {
    const response = await api.get('/orders/arrived-pending-verification')
    return response.data
  }

  /**
   * Obtener detalles de un pedido para verificación
   */
  async getOrderForVerification(orderId: string): Promise<ArrivedOrder & { userPermissions: { isAdmin: boolean; canVerify: boolean } }> {
    const response = await api.get(`/orders/${orderId}/for-verification`)
    return response.data
  }

  /**
   * Verificar cantidades de un pedido (empleado)
   */
  async employeeVerifyOrder(orderId: string, verificationData: VerificationData): Promise<{ message: string; order: Record<string, unknown> }> {
    const response = await api.post(`/orders/${orderId}/employee-verify`, verificationData)
    return response.data
  }

  /**
   * Obtener pedidos pendientes de aprobación (admin)
   */
  async getPendingAdminApproval(): Promise<OrdersResponse<ArrivedOrder>> {
    const response = await api.get('/orders/admin/pending-admin-approval')
    return response.data
  }

  /**
   * Aprobar o rechazar verificación (admin)
   */
  async adminApproveVerification(orderId: string, approvalData: AdminApprovalData): Promise<{ message: string; order: Record<string, unknown> }> {
    const response = await api.post(`/orders/${orderId}/admin-approve`, approvalData)
    return response.data
  }

  /**
   * Obtener pedidos verificados con filtros y paginación
   */
  async getVerifiedOrders(filters: VerifiedOrdersFilters = {}): Promise<OrdersResponse<VerifiedOrder>> {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })

    const response = await api.get(`/orders/verified?${params.toString()}`)
    return response.data
  }
}

export const orderVerificationService = new OrderVerificationService()