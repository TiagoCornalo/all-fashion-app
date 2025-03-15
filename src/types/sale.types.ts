export interface SaleItem {
  product: string // ID del producto
  quantity: number
  price: number
  subtotal: number
  name?: string // Para mostrar en la UI
}

export type PaymentType = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER'

export interface Payment {
  method: PaymentType
  amount: number
}

export interface Invoice {
  type: 'TICKET' | 'A' | 'B' | 'C'
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
