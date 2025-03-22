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
