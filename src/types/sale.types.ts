export interface SaleItem {
  product: string // ID del producto
  quantity: number
  price: number
  subtotal: number
  name?: string // Para mostrar en la UI
  originalPrice?: number
  discountAmount?: number
  discountPercentage?: number
  discounted?: boolean
  stock?: number
}

export type PaymentType = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER'

export interface Payment {
  method: PaymentType
  amount: number
}

export interface Combo {
  comboId: string
  quantity: number
  name?: string
  price?: number
}

export interface ItemPromotion {
  itemIndex: number
  promotionCode: string
}

export interface Invoice {
  type: 'TICKET' | 'A' | 'B' | 'C' | 'X'
  pointOfSale: number
  customerName?: string
  customer?: {
    documentType: 'DNI' | 'CUIT'
    documentNumber: string
  }
}

export interface CreateSale {
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes?: string
  cashRegister?: string
  promotionCode?: string // Código para toda la venta
  itemPromotions?: ItemPromotion[] // Promociones por ítem
  combos?: Combo[] // Combos seleccionados
}

export interface Sale {
  _id: string
  date: string
  total: number
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes?: string
  cashRegister: string
  createdBy: {
    _id: string
    name: string
  }
  seller: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}
