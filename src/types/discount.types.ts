export interface Discount {
  _id: string
  code: string
  description: string
  discountPercentage: number
  usageLimit: number | null
  currentUsageCount: number
  isActive: boolean
  startDate: Date
  endDate: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateDiscount {
  code: string
  description: string
  discountPercentage: number
  usageLimit: number | null
  isActive: boolean
  startDate: Date | null
  endDate: Date | null
}

export interface UpdateDiscount {
  code: string
  description: string
  discountPercentage: number
  usageLimit: number | null
  isActive: boolean
  startDate: Date | null
  endDate: Date | null
}

// Tipos para el historial de usos de promociones
export interface PromotionUsage {
  _id: string
  promotionId: string
  promotionCode: string
  customer: {
    name: string
    documentType: 'DNI' | 'CUIT'
    documentNumber: string
    phone?: string
    email?: string
    address?: string
  }
  discountInfo: {
    discountPercentage: number
    discountAmount: number
    originalAmount: number
    finalAmount: number
    applicationType: 'GLOBAL' | 'ITEM'
    affectedItems?: number[]
  }
  saleId?: {
    _id: string
    invoice: {
      number?: string
      type: string
    }
    createdAt: Date
  }
  appliedBy?: {
    _id: string
    name: string
  }
  notes: string
  pointOfSale: number
  createdAt: Date
  updatedAt: Date
}

export interface PromotionUsageHistoryResponse {
  data: PromotionUsage[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    promotion: {
      code: string
      description: string
      discountPercentage: number
    }
  }
}
