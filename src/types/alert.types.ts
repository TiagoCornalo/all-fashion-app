export interface Alert {
  _id: string
  type: 'NO_STOCK' | 'BELOW_MINIMUM' | 'NEAR_MINIMUM'
  product: {
    _id: string
    name: string
    code: string
  }
  message: string
  status: 'PENDING' | 'RESOLVED'
  createdAt: string
}
