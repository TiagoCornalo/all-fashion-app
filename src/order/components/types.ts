// Definición de tipos para la orden
export interface ProductInfo {
  _id: string
  code: string
  name: string
  price: number
  basePrice?: number
  baseCurrency?: 'ARS' | 'USD'
}

export interface OrderItem {
  _id: string
  product: ProductInfo | null
  quantity: number
  currentStock: number
  minimumStock: number
  unitCost?: number
  costCurrency?: 'ARS' | 'USD'
}

export interface ContactInfo {
  email: string
  phone: string
}

export interface Supplier {
  _id: string
  name: string
  contact?: ContactInfo
}

export interface OrderAlert {
  _id: string
  type: string
  message: string
  createdAt: string
}

export interface Order {
  _id: string
  supplier: Supplier | null
  items: OrderItem[]
  status: string
  notes: string
  createdFrom: string
  relatedAlerts: OrderAlert[]
  createdAt: string
  updatedAt: string
  totalQuantity: number
  __v: number
}
