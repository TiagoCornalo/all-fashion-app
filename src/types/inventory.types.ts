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
  price: number
  priceUSD?: number | null
  supplier: Supplier
  createdAt: string
  updatedAt: string
}

export interface ExchangeRate {
  value: number
  type: string
  valueKind: string
  surchargeArs: number
  enabled: boolean
  fetchedAt: string
  sourceUpdatedAt?: string | null
  stale: boolean
  cached: boolean
}

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
}

export interface GetSuppliersParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, string>
}
