/* const saleItemSchema = new mongoose.Schema({
  product: {
    type: String,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  // Si el item proviene de un combo
  fromCombo: {
    comboId: {
      type: String,
      ref: 'ProductCombo'
    },
    comboName: String,
    comboCode: String
  }
})

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'MP'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  // Para transferencias
  transferReference: String,
  // Para Mercado Pago
  mpReference: String
})

const saleSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  // Datos de la venta
  items: [saleItemSchema],
  subtotal: Number,
  tax: Number, // IVA
  total: Number,
  payments: [paymentSchema],

  // Datos de facturación AFIP
  invoice: {
    type: {
      type: String,
      enum: ['A', 'B', 'C', 'X'],
      required: true
    },
    pointOfSale: {
      type: Number,
      required: true,
      default: 1
    },
    number: String,
    cae: String,
    caeExpirationDate: Date,
    customerName: String,
    customer: {
      documentType: {
        type: String,
        enum: ['DNI', 'CUIT'],
        required: function() {
          return this.type === 'A' // Solo requerido para factura A
        }
      },
      documentNumber: {
        type: String,
        required: function() {
          return this.type === 'A' // Solo requerido para factura A
        }
      },
      name: String,
      address: String
    }
  },

  // Datos operativos
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING'
  },
  seller: {
    type: String,
    ref: 'User'
  },
  cashRegister: {
    type: String,
    ref: 'CashRegister',
    required: false
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Información de promoción aplicada (global)
  promotionApplied: {
    promotionId: {
      type: String,
      ref: 'Promotion'
    },
    code: String,
    discountPercentage: Number,
    discountAmount: Number,
    applied: String // "GLOBAL" o "ITEM"
  },

  // Información de promociones por ítem
  itemPromotions: [{
    productId: String,
    discountPercentage: Number,
    originalPrice: Number,
    discountedPrice: Number,
    discountAmount: Number,
    code: String
  }],

  // Información de combos aplicados
  combosApplied: [{
    comboId: {
      type: String,
      ref: 'ProductCombo'
    },
    name: String,
    code: String,
    quantity: Number,
    originalPrice: Number,
    totalPrice: Number
  }]
}) */

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
  transferReference?: string
  customerPhone?: string
  _id?: string
  requiresVerification?: boolean
  verified?: boolean
  verificationDate?: string
  verificationNotes?: string
  verifiedBy?: string
  verificationInfo?: {
    customerPhone: string
    transferReference: string
    amount: number
    status: string
  }
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
  productId?: string
  discountPercentage?: number
  originalPrice?: number
  discountedPrice?: number
  discountAmount?: number
  code?: string
}

export interface Invoice {
  type: 'TICKET' | 'A' | 'B' | 'C' | 'X'
  pointOfSale: number
  customerName?: string
  customer?: {
    documentType: 'DNI' | 'CUIT'
    documentNumber: string
    name: string
    address?: string
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
  date?: string
  total: number
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes?: string
  cashRegister: {
    _id: string
    name?: string
    status?: string
  }
  createdBy?: {
    _id: string
    name: string
  }
  seller: {
    _id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  subtotal?: number
  tax?: number
  promotionApplied?: {
    promotionId: string
    code: string
    discountPercentage: number
    discountAmount: number
    applied: string
  }
  itemPromotions?: ItemPromotion[]
  combosApplied?: {
    comboId: string
    name: string
    code: string
    quantity: number
    originalPrice: number
    totalPrice: number
  }[]
  transferPayments?: Payment[]
}
