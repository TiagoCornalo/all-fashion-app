import api from './config/axios'
import {
  BarcodeLookupResponse,
  InventoryReceiptItemInput,
  LabelProduct,
  PreparedProductLabel,
  ProductBarcode
} from '../types/barcode.types'

export async function searchLabelProducts(search: string, exact = false): Promise<LabelProduct[]> {
  const { data } = await api.get('/products/labels/search', { params: { search, exact } })
  return data.data
}

export const findProductByBarcode = async (
  value: string
): Promise<BarcodeLookupResponse> => {
  const response = await api.get<BarcodeLookupResponse>(
    `/products/scan/${encodeURIComponent(value.trim())}`
  )
  return response.data
}

export const prepareProductLabels = async (
  productIds: string[],
  preference: 'PRIMARY_OR_INTERNAL' | 'INTERNAL' = 'PRIMARY_OR_INTERNAL'
): Promise<PreparedProductLabel[]> => {
  const response = await api.post<{ data: PreparedProductLabel[] }>(
    '/products/barcodes/prepare',
    { productIds, preference }
  )
  return response.data.data
}

export const getProductBarcodes = async (
  productId: string
): Promise<ProductBarcode[]> => {
  const response = await api.get<{ data: ProductBarcode[] }>(
    `/products/${productId}/barcodes`
  )
  return response.data.data
}

export const addProductBarcode = async (
  productId: string,
  input: {
    value: string
    format?: string
    origin?: string
    isPrimary?: boolean
    unitsPerScan?: number
  }
): Promise<ProductBarcode> => {
  const response = await api.post<ProductBarcode>(
    `/products/${productId}/barcodes`,
    input
  )
  return response.data
}

export const generateInternalProductBarcode = async (
  productId: string
): Promise<ProductBarcode> => {
  const response = await api.post<ProductBarcode>(
    `/products/${productId}/barcodes/generate`
  )
  return response.data
}

export const deactivateProductBarcode = async (
  productId: string,
  barcodeId: string
) => {
  const response = await api.delete(
    `/products/${productId}/barcodes/${barcodeId}`
  )
  return response.data
}

export const createInventoryReceipt = async (input: {
  idempotencyKey: string
  items: InventoryReceiptItemInput[]
  notes?: string
}) => {
  const response = await api.post('/inventory/receipts', input, {
    headers: { 'X-Idempotency-Key': input.idempotencyKey }
  })
  return response.data
}
