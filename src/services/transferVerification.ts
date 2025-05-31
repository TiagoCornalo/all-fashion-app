import api from './config/axios'
import { Sale, Payment } from '../types/sale.types'

export interface VerifyTransferRequest {
  paymentId: string
  verified: boolean
  notes?: string
}

export interface PendingTransfersResponse {
  data: Sale[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * Obtiene todas las transferencias pendientes de verificación
 * @param params - Parámetros de paginación y filtros
 * @returns Lista de ventas con transferencias pendientes
 */
export const getPendingTransfers = async (params?: {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
}): Promise<PendingTransfersResponse> => {
  const response = await api.get('/sales/transfers/pending', { params })
  return response.data
}

/**
 * Verifica una transferencia específica
 * @param saleId - ID de la venta
 * @param data - Datos de verificación
 * @returns Venta actualizada
 */
export const verifyTransfer = async (
  saleId: string,
  data: VerifyTransferRequest
): Promise<{ message: string; sale: Sale; payment: Payment }> => {
  const response = await api.put(`/sales/${saleId}/verify-transfer`, data)
  return response.data
}

/**
 * Obtiene el detalle de un proveedor
 * @param supplierId - ID del proveedor
 * @returns Información del proveedor
 */
export const getSupplierDetail = async (supplierId: string) => {
  const response = await api.get(`/suppliers/${supplierId}`)
  return response.data
}

/**
 * Reenvía el comprobante al proveedor (simulación)
 * @param data - Datos para el reenvío
 * @returns Resultado del reenvío
 */
export const resendReceiptToSupplier = async (data: {
  saleId: string
  supplierId: string
  customerPhone: string
  supplierPhone: string
  amount: number
  transferReference: string
}): Promise<{ message: string; success: boolean }> => {
  // Por ahora simulamos el reenvío, pero aquí se podría integrar con WhatsApp API
  console.log('Reenviando comprobante al proveedor:', data)

  // Simulamos una llamada a la API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: `Comprobante reenviado exitosamente al proveedor (${data.supplierPhone})`,
        success: true
      })
    }, 1000)
  })
}