/**
 * Tipos para el sistema de remitos y presupuestos
 */

/**
 * Datos del cliente en el remito
 */
export interface QuoteCustomer {
  name: string
  documentType?: 'DNI' | 'CUIT' | 'CUIL'
  documentNumber?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
}

/**
 * Producto en el remito
 */
export interface QuoteItem {
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
  description?: string
}

/**
 * Descuento aplicado en el remito
 */
export interface QuoteDiscount {
  type: 'percentage' | 'fixed'
  value: number
  description?: string
}

/**
 * Remito/Presupuesto
 */
export interface Quote {
  _id?: string
  number: string
  type: 'QUOTE' | 'ESTIMATE' | 'INVOICE'
  customer: QuoteCustomer
  items: QuoteItem[]
  subtotal: number
  discount?: QuoteDiscount
  tax: number
  total: number
  validUntil?: Date
  notes?: string
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DTO para crear un remito
 */
export interface CreateQuoteDto {
  type: 'QUOTE' | 'ESTIMATE' | 'INVOICE'
  customer: QuoteCustomer
  items: QuoteItem[]
  discount?: QuoteDiscount
  tax?: number
  validUntil?: Date
  notes?: string
}

/**
 * DTO para actualizar un remito
 */
export interface UpdateQuoteDto {
  customer?: QuoteCustomer
  items?: QuoteItem[]
  discount?: QuoteDiscount
  tax?: number
  validUntil?: Date
  notes?: string
  status?: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
}

/**
 * Filtros para buscar remitos
 */
export interface QuoteFilters {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: string
  type?: string
  customer?: string
  dateFrom?: Date
  dateTo?: Date
}

/**
 * Configuración de la empresa para el remito
 */
export interface CompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  website?: string
  taxId?: string
  logo?: string
}