import { Product } from './inventory.types'

export type BarcodeFormat =
  | 'CODE128'
  | 'EAN13'
  | 'EAN8'
  | 'UPCA'
  | 'QR'
  | 'UNKNOWN'

export interface ProductBarcode {
  _id?: string
  product?: string
  value: string
  normalizedValue: string
  format: BarcodeFormat
  origin: 'MANUFACTURER' | 'INTERNAL' | 'LEGACY'
  isPrimary: boolean
  active?: boolean
  unitsPerScan: number
}

export interface BarcodeLookupResponse {
  product: Product
  match: 'BARCODE' | 'PRODUCT_CODE'
  barcode: ProductBarcode
}

export type LabelProduct = Pick<Product, '_id' | 'code' | 'name' | 'price'>

export interface PreparedProductLabel {
  product: LabelProduct
  barcode: ProductBarcode
  finalPriceArs?: number
}

export interface InventoryReceiptItemInput {
  productId: string
  barcodeValue?: string
  quantity: number
}

export interface InventoryReceiptResponse {
  receipt: {
    _id: string
    totalUnits: number
    items: Array<{
      product: string | { _id: string; stock: number }
      quantity: number
      stockBefore: number
      stockAfter: number
    }>
  }
  repeatedRequest: boolean
}
