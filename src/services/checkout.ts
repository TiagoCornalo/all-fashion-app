import api from './config/axios'
import { CreateSale, Payment, Sale, SaleItem } from '../types/sale.types'

export type CheckoutRequest = Omit<CreateSale, 'items' | 'payments'> & {
  items: Array<Pick<SaleItem, 'product' | 'quantity'>>
  payments: Array<Payment & { baseAmount: number }>
  previewHash?: string
  promotionCustomerData?: unknown
}
export interface CheckoutPreview {
  items: SaleItem[]
  combos: Array<{ comboId: string; quantity: number; name: string; originalPrice: number; totalPrice: number }>
  payments: Payment[]
  subtotal: number
  total: number
  remaining: number
  previewHash: string
  transferSurcharge: { applied: boolean; amount: number; percentage: number }
  installmentPlans: Array<{ baseAmount: number; totalWithInterest: number; interestAmount: number; label: string; installments: Array<{ number: number; amount: number; dueDate: string }> }>
}
export interface FiscalInvoiceStatus {
  _id: string
  status: 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'UNCERTAIN'
  message?: string
  cae?: string
  number?: number
  environment?: 'homologation' | 'production'
  blockedBy?: string
  payload?: { CbteTipo: number }
}
export interface FiscalConfig {
  configured: boolean
  environment: string
  pointOfSale: number | null
  issuerCondition: string | null
  standardA: boolean
  error?: string
}
export interface CheckoutResult { sale: Sale; fiscal?: FiscalInvoiceStatus | null; metadata?: { warning?: string } }
export const previewCheckout = async (data: CheckoutRequest): Promise<CheckoutPreview> => (await api.post('/sales/preview', data)).data
export const submitCheckout = async (data: CheckoutRequest, key: string): Promise<CheckoutResult> =>
  (await api.post('/sales', data, { headers: { 'X-Idempotency-Key': key } })).data
export const getFiscalConfig = async (): Promise<FiscalConfig> => (await api.get('/fiscal/config')).data
export const getFiscalInvoice = async (id: string): Promise<FiscalInvoiceStatus> => (await api.get(`/fiscal/${id}`)).data
export const processFiscalInvoice = async (id: string): Promise<FiscalInvoiceStatus> => (await api.post(`/fiscal/${id}/process`, {}, { timeout: 60000 })).data
export const getReceiptHtml = async (id: string, format: 'thermal' | 'a4'): Promise<string> =>
  (await api.get(`/fiscal/${id}/document`, { params: { format }, responseType: 'text' })).data
export const checkoutError = (error: unknown): string => {
  const e = error as { response?: { data?: { details?: string; error?: string } }; message?: string }
  return e.response?.data?.details || e.response?.data?.error || e.message || 'No se pudo completar la operación'
}

export const correctFiscalInvoice = async (id: string, invoice: CreateSale['invoice']): Promise<FiscalInvoiceStatus> => (await api.post(`/fiscal/${id}/correct`, { invoice })).data
