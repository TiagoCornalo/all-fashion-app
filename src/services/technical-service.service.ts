import api from './config/axios'
import {
  TechnicalService,
  CreateTechnicalServiceDto,
  UpdateTechnicalServiceDto,
  StatusChangeDto,
  AddPartDto,
  RegisterPaymentDto,
  TechnicalServiceFilters,
  ServiceDashboardStats,
  CreateFromTemplateDto
} from '../types/technical-service.types'

export class TechnicalServiceService {
  private baseUrl = '/technical-services'

  /**
   * Obtener lista de servicios técnicos con filtros
   */
  async getTechnicalServices(filters?: TechnicalServiceFilters): Promise<{
    data: TechnicalService[]
    meta: {
      total: number
      page: number
      pageSize: number
      totalPages: number
      appliedFilters?: Record<string, unknown>
      summary?: Record<string, unknown>
    }
  }> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    const response = await api.get(`${this.baseUrl}?${params}`)
    return response.data
  }

  /**
   * Obtener un servicio técnico específico
   */
  async getTechnicalServiceById(id: string): Promise<TechnicalService> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    return response.data.data
  }

  /**
   * Crear un nuevo servicio técnico
   */
  async createTechnicalService(data: CreateTechnicalServiceDto): Promise<TechnicalService> {
    const response = await api.post(this.baseUrl, data)
    return response.data.data
  }

  /**
   * Actualizar un servicio técnico existente
   */
  async updateTechnicalService(id: string, data: UpdateTechnicalServiceDto): Promise<TechnicalService> {
    const response = await api.put(`${this.baseUrl}/${id}`, data)
    return response.data.data
  }

  /**
   * Cambiar estado del servicio técnico
   */
  async changeServiceStatus(id: string, data: StatusChangeDto): Promise<{
    serviceId: string
    serviceNumber: string
    statusChange: {
      oldStatus: string
      newStatus: string
      changedAt: Date
    }
    availableNextStates: string[]
  }> {
    const response = await api.put(`${this.baseUrl}/${id}/status`, data)
    return response.data.data
  }

  /**
   * Agregar pieza al servicio técnico
   */
  async addPartToService(id: string, data: AddPartDto): Promise<{
    partAdded: {
      _id: string
      product: {
        _id: string
        name: string
        code?: string
        price: number
      }
      quantity: number
      unitPrice: number
      subtotal: number
      addedAt: Date
      addedBy?: string
      notes?: string
    }
    service: {
      id: string
      newPartsCost: number
      newTotalCost: number
    }
    productUpdated: {
      id: string
      newStock: number
    }
  }> {
    const response = await api.post(`${this.baseUrl}/${id}/parts`, data)
    return response.data.data
  }

  /**
   * Remover pieza del servicio técnico
   */
  async removePartFromService(serviceId: string, partId: string): Promise<{
    partRemoved: {
      partId: string
      productId: string
      quantity: number
      subtotal: number
    }
    service: {
      id: string
      newPartsCost: number
      newTotalCost: number
    }
    productUpdated: {
      id: string
      newStock: number
    } | null
  }> {
    const response = await api.delete(`${this.baseUrl}/${serviceId}/parts/${partId}`)
    return response.data.data
  }

  /**
   * Registrar pago del servicio técnico
   */
  async registerServicePayment(id: string, data: RegisterPaymentDto): Promise<{
    serviceId: string
    payment: {
      isPaid: boolean
      paymentMethod: string
      paidAmount: number
      paidAt: Date
      receivedBy: string
    }
    totalCost: number
    balance: number
  }> {
    const response = await api.post(`${this.baseUrl}/${id}/payment`, data)
    return response.data.data
  }

  /**
   * Eliminar servicio técnico
   */
  async deleteTechnicalService(id: string): Promise<{
    message: string
    deletedServiceId: string
    deletedServiceNumber: string
    stockReturned: boolean
  }> {
    const response = await api.delete(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Generar número de servicio automático
   */
  async generateServiceNumber(): Promise<{
    generatedNumber: string
    year: number
    month: number
    timestamp: Date
  }> {
    const response = await api.get(`${this.baseUrl}/generate-number`)
    return response.data
  }

  /**
   * Obtener estadísticas para dashboard
   */
  async getDashboardStats(): Promise<ServiceDashboardStats> {
    const response = await api.get(`${this.baseUrl}/dashboard/stats`)
    return response.data.data
  }

  /**
   * Crear servicio desde template
   */
  async createServiceFromTemplate(data: CreateFromTemplateDto): Promise<TechnicalService> {
    const response = await api.post(`${this.baseUrl}/from-template`, data)
    return response.data.data
  }

  /**
   * Obtener marcas únicas de equipos
   */
  async getUniqueBrands(): Promise<string[]> {
    const response = await api.get(`${this.baseUrl}/brands`)
    return response.data.data || []
  }
}

// Instancia del servicio
const technicalServiceService = new TechnicalServiceService()

// Exportar métodos individuales para usar con React Query
export const getTechnicalServices = (filters?: TechnicalServiceFilters) =>
  technicalServiceService.getTechnicalServices(filters)

export const getTechnicalServiceById = (id: string) =>
  technicalServiceService.getTechnicalServiceById(id)

export const createTechnicalService = (data: CreateTechnicalServiceDto) =>
  technicalServiceService.createTechnicalService(data)

export const updateTechnicalService = (id: string, data: UpdateTechnicalServiceDto) =>
  technicalServiceService.updateTechnicalService(id, data)

export const changeServiceStatus = (id: string, data: StatusChangeDto) =>
  technicalServiceService.changeServiceStatus(id, data)

export const addPartToService = (id: string, data: AddPartDto) =>
  technicalServiceService.addPartToService(id, data)

export const removePartFromService = (serviceId: string, partId: string) =>
  technicalServiceService.removePartFromService(serviceId, partId)

export const registerServicePayment = (id: string, data: RegisterPaymentDto) =>
  technicalServiceService.registerServicePayment(id, data)

export const deleteTechnicalService = (id: string) =>
  technicalServiceService.deleteTechnicalService(id)

export const generateServiceNumber = () =>
  technicalServiceService.generateServiceNumber()

export const getDashboardStats = () =>
  technicalServiceService.getDashboardStats()

export const createServiceFromTemplate = (data: CreateFromTemplateDto) =>
  technicalServiceService.createServiceFromTemplate(data)

export const getUniqueBrands = () =>
  technicalServiceService.getUniqueBrands()

export default technicalServiceService