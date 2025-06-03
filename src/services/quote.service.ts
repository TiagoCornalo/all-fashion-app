import api from './config/axios'
import { Quote, CreateQuoteDto, UpdateQuoteDto, QuoteFilters, CompanyInfo } from '../types/quote.types'

/**
 * Servicio para gestionar remitos y presupuestos
 */
export class QuoteService {
  private baseUrl = '/quotes'

  /**
   * Convertir datos del frontend al formato del backend
   */
  private mapToBackendFormat(data: CreateQuoteDto | UpdateQuoteDto): any {
    return {
      ...data,
      // Convertir customer a customerData para el backend
      customerData: data.customer,
      customer: undefined,
      // Convertir items al formato del backend
      items: data.items?.map(item => ({
        product: item.productId, // Backend espera 'product' no 'productId'
        quantity: item.quantity,
        price: item.unitPrice,    // Backend espera 'price' no 'unitPrice'
        subtotal: item.subtotal
      }))
    }
  }

  /**
   * Convertir datos del backend al formato del frontend
   */
  private mapFromBackendFormat(data: any): Quote {
    return {
      ...data,
      // Convertir customerData a customer para el frontend
      customer: data.customerData || data.customer,
      customerData: undefined,
      // Convertir items al formato del frontend
      items: data.items?.map((item: any) => ({
        productId: typeof item.product === 'object' ? item.product._id : item.product,
        productCode: typeof item.product === 'object' ? item.product.code : '',
        productName: typeof item.product === 'object' ? item.product.name : '',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.subtotal,
        description: item.description
      })) || []
    }
  }

  /**
   * Obtener todas las cotizaciones
   */
  async getQuotes(filters?: QuoteFilters): Promise<{
    data: Quote[]
    meta: {
      total: number
      page: number
      pageSize: number
      totalPages: number
    }
  }> {
    const response = await api.get(this.baseUrl, { params: filters })

    // El backend devuelve los datos en response.data.data si usa formatApiResponse
    const quotes = (response.data.data || response.data || []).map((quote: any) =>
      this.mapFromBackendFormat(quote)
    )

    return {
      data: quotes,
      meta: response.data.meta || {
        total: quotes.length,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
        totalPages: Math.ceil(quotes.length / (filters?.pageSize || 10))
      }
    }
  }

  /**
   * Obtener una cotización por ID
   */
  async getQuoteById(id: string): Promise<Quote> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    const quoteData = response.data.data || response.data
    return this.mapFromBackendFormat(quoteData)
  }

  /**
   * Crear una nueva cotización
   */
  async createQuote(data: CreateQuoteDto): Promise<Quote> {
    const backendData = this.mapToBackendFormat(data)
    const response = await api.post(this.baseUrl, backendData)
    const quoteData = response.data.data || response.data
    return this.mapFromBackendFormat(quoteData)
  }

  /**
   * Actualizar una cotización
   */
  async updateQuote(id: string, data: UpdateQuoteDto): Promise<Quote> {
    const backendData = this.mapToBackendFormat(data)
    const response = await api.put(`${this.baseUrl}/${id}`, backendData)
    const quoteData = response.data.data || response.data
    return this.mapFromBackendFormat(quoteData)
  }

  /**
   * Eliminar una cotización
   */
  async deleteQuote(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Convertir cotización a venta
   */
  async convertToSale(id: string): Promise<{ success: boolean; saleId: string; message: string }> {
    const response = await api.post(`${this.baseUrl}/${id}/convert-to-sale`)
    return response.data
  }

  /**
   * Generar número de cotización
   */
  async generateQuoteNumber(): Promise<string> {
    const response = await api.get(`${this.baseUrl}/generate-number`)
    return response.data.generatedNumber || response.data.number
  }

  /**
   * Obtener configuración de la empresa
   */
  async getCompanyInfo(): Promise<CompanyInfo> {
    // Por ahora devuelvo datos mock, después se puede conectar a una API
    return {
      name: 'All Fashion',
      address: 'Dirección de la empresa',
      phone: '+54 11 1234-5678',
      email: 'info@allfashion.com',
      website: 'www.allfashion.com',
      taxId: '30-12345678-9'
    }
  }
}

export const quoteService = new QuoteService()

// Funciones exportadas para compatibilidad
export const getQuotes = (filters?: QuoteFilters) => quoteService.getQuotes(filters)
export const getQuoteById = (id: string) => quoteService.getQuoteById(id)
export const createQuote = (data: CreateQuoteDto) => quoteService.createQuote(data)
export const updateQuote = (id: string, data: UpdateQuoteDto) => quoteService.updateQuote(id, data)
export const deleteQuote = (id: string) => quoteService.deleteQuote(id)
export const convertToSale = (id: string) => quoteService.convertToSale(id)
export const generateQuoteNumber = () => quoteService.generateQuoteNumber()
export const getCompanyInfo = () => quoteService.getCompanyInfo()