import api from './config/axios'
import {
  ServiceTemplate,
  CreateServiceTemplateDto,
  UpdateServiceTemplateDto,
  ServiceTemplateFilters,
  EquipmentType
} from '../types/technical-service.types'

export class ServiceTemplateService {
  private baseUrl = '/service-templates'

  /**
   * Obtener lista de templates de servicios con filtros
   */
  async getServiceTemplates(filters?: ServiceTemplateFilters): Promise<{
    data: ServiceTemplate[]
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
   * Obtener templates aplicables para un tipo de equipo y marca específicos
   */
  async getApplicableTemplates(equipmentType: EquipmentType, brand?: string): Promise<{
    data: Array<ServiceTemplate & {
      estimatedCostWithCurrentPrices: {
        laborCost: number
        partsCost: number
        totalCost: number
        partsAvailable: boolean
      }
    }>
    meta: {
      equipmentType: string
      brand?: string
      availableCount: number
      message: string
    }
  }> {
    const params = new URLSearchParams({ equipmentType })
    if (brand) params.append('brand', brand)

    const response = await api.get(`${this.baseUrl}/applicable?${params}`)
    return response.data
  }

  /**
   * Obtener un template específico
   */
  async getServiceTemplateById(id: string): Promise<ServiceTemplate> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    return response.data.data
  }

  /**
   * Crear un nuevo template de servicio
   */
  async createServiceTemplate(data: CreateServiceTemplateDto): Promise<ServiceTemplate> {
    const response = await api.post(this.baseUrl, data)
    return response.data.data
  }

  /**
   * Actualizar un template existente
   */
  async updateServiceTemplate(id: string, data: UpdateServiceTemplateDto): Promise<ServiceTemplate> {
    const response = await api.put(`${this.baseUrl}/${id}`, data)
    return response.data.data
  }

  /**
   * Eliminar template
   */
  async deleteServiceTemplate(id: string): Promise<{
    message: string
    templateId: string
    templateName?: string
    reason?: string
    affectedServices?: number
  }> {
    const response = await api.delete(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Duplicar un template existente
   */
  async duplicateServiceTemplate(id: string, newName: string, newCode?: string): Promise<ServiceTemplate> {
    const response = await api.post(`${this.baseUrl}/${id}/duplicate`, {
      newName,
      newCode
    })
    return response.data.data
  }

  /**
   * Generar código automático para un template
   */
  async generateTemplateCode(category: string, name: string): Promise<{
    generatedCode: string
    category: string
    name: string
    timestamp: Date
  }> {
    const params = new URLSearchParams({ category, name })
    const response = await api.get(`${this.baseUrl}/generate-code?${params}`)
    return response.data
  }
}

// Instancia del servicio
const serviceTemplateService = new ServiceTemplateService()

// Exportar métodos individuales para usar con React Query
export const getServiceTemplates = (filters?: ServiceTemplateFilters) =>
  serviceTemplateService.getServiceTemplates(filters)

export const getApplicableTemplates = (equipmentType: EquipmentType, brand?: string) =>
  serviceTemplateService.getApplicableTemplates(equipmentType, brand)

export const getServiceTemplateById = (id: string) =>
  serviceTemplateService.getServiceTemplateById(id)

export const createServiceTemplate = (data: CreateServiceTemplateDto) =>
  serviceTemplateService.createServiceTemplate(data)

export const updateServiceTemplate = (id: string, data: UpdateServiceTemplateDto) =>
  serviceTemplateService.updateServiceTemplate(id, data)

export const deleteServiceTemplate = (id: string) =>
  serviceTemplateService.deleteServiceTemplate(id)

export const duplicateServiceTemplate = (id: string, newName: string, newCode?: string) =>
  serviceTemplateService.duplicateServiceTemplate(id, newName, newCode)

export const generateTemplateCode = (category: string, name: string) =>
  serviceTemplateService.generateTemplateCode(category, name)

export default serviceTemplateService