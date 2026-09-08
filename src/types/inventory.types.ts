export interface Supplier {
  name: string
  contact?: {
    email?: string
    phone?: string
  }
  isPlaceholder?: boolean
  _id?: string
  createdAt?: Date
  updatedAt?: string
  verifiedTransfers?: VerifiedTransfer[]
  transfersSummary?: TransfersSummary
}

export interface VerifiedTransfer {
  _id: string
  saleId: {
    _id: string
    createdAt: string
  }
  paymentId: string
  totalPaymentAmount: number
  customerPhone: string
  verifiedAt: string
  verifiedBy: string
  verificationNotes: string
  productsInSale: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
    _id: string
  }>
  supplierPortion: number
  createdAt: string
}

export interface TransfersSummary {
  totalAmount: number
  transfersCount: number
  transfers: VerifiedTransfer[]
  period: {
    startDate: string | null
    endDate: string | null
  }
}

export interface Product {
  _id: string
  code: string
  name: string
  description: string
  stock: number
  stockMinimum: number
  basePrice?: number | null
  baseCurrency?: 'ARS' | 'USD'
  price: number
  priceUSD?: number | null
  usdRateType?: 'blue' | 'oficial' | 'mep' | 'tarjeta' | null
  supplier?: Supplier | null
  createdAt: string
  updatedAt: string
  barcodes?: Array<{
    _id?: string
    value: string
    normalizedValue: string
    format: string
    origin: string
    isPrimary: boolean
    unitsPerScan: number
  }>
  primaryBarcode?: {
    _id?: string
    value: string
    normalizedValue: string
    format: string
    origin: string
    isPrimary: boolean
    unitsPerScan: number
  } | null
}

export interface ExchangeRate {
  value: number
  effectiveRateValue?: number | null
  pricingFormula?: 'USD_X_EFFECTIVE_RATE_V2'
  type: string
  valueKind: string
  surchargeArs: number
  enabled: boolean
  fetchedAt: string
  sourceUpdatedAt?: string | null
  source?: string
  provider?: string
  stale: boolean
  cached: boolean
  fallback?: boolean
  refreshError?: string
}

export type USDRateType = NonNullable<Product['usdRateType']>

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface TableFilters {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, string>
}

export type CreateProduct = Omit<Product, '_id' | 'createdAt' | 'updatedAt'> & {
  description?: string
  barcode?: string
  barcodeUnitsPerScan?: number
}

export interface GetSuppliersParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, string>
}
