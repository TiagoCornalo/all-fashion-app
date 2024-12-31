export interface Supplier {
  _id: string
  name: string
  contact: {
    email: string
    phone: string
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
  supplier: Supplier
  createdAt: string
  updatedAt: string
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
