export interface ComboItem {
  product: string
  quantity: number
}

/**
 * Interfaz que define un combo de productos completo
 * Representa una agrupación de productos que se venden como una unidad
 */
export interface ProductCombo {
  _id: string
  name: string
  code: string
  description?: string
  items: ComboItem[]
  price: number
  image?: string
  usageLimit: number | null
  currentUsageCount: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export type CreateProductComboDto = Omit<
  ProductCombo,
  '_id' | 'createdAt' | 'updatedAt'
>

export type UpdateProductComboDto = Partial<CreateProductComboDto>
