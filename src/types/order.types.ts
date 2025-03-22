export interface Order {
  items: OrderItem[]
  supplierId: string
  notes?: string
  _id?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface OrderItem {
  productId: string
  quantity: number
}

export interface OrderProduct {
  _id: string
  product: {
    _id: string
    name: string
    code: string
    price: number
  } | null
  quantity: number
  currentStock: number
  minimumStock: number
}

export interface OrderDetail {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  items: OrderProduct[]
  status: 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  notes?: string
  createdAt: string
  updatedAt: string
  createdFrom: 'MANUAL' | 'AUTO'
  totalQuantity: number
  relatedAlerts: unknown[]
  __v: number
}
