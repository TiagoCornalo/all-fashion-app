export interface SaleItem {
  product: string // ID del producto
  quantity: number
  price: number
  name?: string // Para mostrar en la UI
}

export type PaymentType = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER'

export interface Payment {
  type: PaymentType
  amount: number
}

export interface Invoice {
  type: 'TICKET' | 'FACTURA_A' | 'FACTURA_B'
  customerName?: string
  customerDocument?: string
}

export interface CreateSale {
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes?: string
  cashRegister?: string
}