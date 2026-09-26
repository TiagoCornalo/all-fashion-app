import { create } from 'zustand'
import {
  SaleItem,
  Payment,
  Invoice,
  CreateSale,
  PaymentType,
  Combo,
  ItemPromotion
} from '../types/sale.types'
import api from '../services/config/axios'

interface SaleStore {
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes: string
  total: number
  selectedMethods: PaymentType[]
  paymentAmounts: Record<string, number>
  remaining: number

  // Campos para transferencias
  transferData: Record<string, { customerPhone?: string; transferReference?: string }>

  // Bancos seleccionados por método (solo aplica a DEBIT/CREDIT)
  paymentBanks: Record<string, string>

  // Campos para detalles de pago (cuenta corriente, etc.)
  paymentDetails: Record<string, any>

  // Nuevos campos para promociones y combos
  promotionCode: string
  itemPromotions: ItemPromotion[]
  combos: Combo[]
  discount: number

  // Datos del cliente para registro de promociones
  promotionCustomerData: {
    promotionCode: string
    customer: {
      name: string
      documentType: 'DNI' | 'CUIT'
      documentNumber: string
      phone?: string
      email?: string
      address?: string
    }
    discountInfo: {
      discountPercentage: number
      discountAmount: number
      originalAmount: number
      finalAmount: number
      applicationType: 'GLOBAL' | 'ITEM'
      affectedItems?: number[]
    }
  } | null

  // Acciones
  addItem: (item: SaleItem) => void
  removeItem: (productId: string) => void
  updateItemQuantity: (productId: string, quantity: number) => void
  setPayments: (payments: Payment[]) => void
  setInvoice: (invoice: Invoice) => void
  setNotes: (notes: string) => void
  clearSale: () => void
  updateTotal: () => void

  // Envío
  createSale: (cashRegisterId: string) => Promise<void>

  // Nuevas acciones
  setSelectedMethods: (methods: PaymentType[]) => void
  updatePaymentAmount: (method: PaymentType, amount: number) => void
  calculateRemaining: () => number
  clearPayments: () => void

  // Acciones para transferencias
  updateTransferData: (method: PaymentType, data: { customerPhone?: string; transferReference?: string }) => void
  getTransferData: (method: PaymentType) => { customerPhone?: string; transferReference?: string }

  // Acciones para banco por método (DEBIT/CREDIT)
  setPaymentBank: (method: PaymentType, bankId: string | undefined) => void
  getPaymentBank: (method: PaymentType) => string | undefined

  // Acciones para detalles de pago
  updatePaymentDetails: (method: PaymentType, details: any) => void
  getPaymentDetails: (method: PaymentType) => any

  // Nuevas acciones para promociones y combos
  setPromotionCode: (code: string) => void
  removeGlobalPromotion: () => void
  addItemPromotion: (itemIndex: number, promotionCode: string, percentage?: number) => void
  removeItemPromotion: (itemIndex: number) => void
  addCombo: (combo: Combo) => void
  removeCombo: (comboId: string) => void
  updateComboQuantity: (comboId: string, quantity: number) => void
  setDiscount: (percentage: number) => void
  replaceItems: (items: SaleItem[]) => void

  // Acciones para registro de promociones
  setPromotionCustomerData: (data: {
    promotionCode: string
    customer: {
      name: string
      documentType: 'DNI' | 'CUIT'
      documentNumber: string
      phone?: string
      email?: string
      address?: string
    }
    discountInfo: {
      discountPercentage: number
      discountAmount: number
      originalAmount: number
      finalAmount: number
      applicationType: 'GLOBAL' | 'ITEM'
      affectedItems?: number[]
    }
  }) => void
  clearPromotionCustomerData: () => void
  registerPromotionUsage: (saleId: string) => Promise<void>
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  items: [],
  payments: [],
  invoice: {
    type: 'TICKET',
    pointOfSale: 1
  },
  notes: '',
  total: 0,
  selectedMethods: [],
  paymentAmounts: {},
  remaining: 0,
  transferData: {},
  paymentBanks: {},
  paymentDetails: {},
  promotionCode: '',
  itemPromotions: [],
  combos: [],
  discount: 0,
  promotionCustomerData: null,

  addItem: (item) => {
    set((state) => ({
      items: [...state.items, item]
    }))
    get().updateTotal()
  },

  removeItem: (productId) => {
    set((state) => {
      const removedIndex = state.items.findIndex(item => item.product === productId)
      if (removedIndex < 0) return {}
      return {
        items: state.items.filter(item => item.product !== productId),
        itemPromotions: state.itemPromotions.filter(p => p.itemIndex !== removedIndex)
          .map(p => ({ ...p, itemIndex: p.itemIndex > removedIndex ? p.itemIndex - 1 : p.itemIndex }))
      }
    })
    get().updateTotal()
  },

  updateItemQuantity: (productId, quantity) => {
    const item = get().items.find(i => i.product === productId)
    if (!Number.isInteger(quantity) || quantity <= 0 || (item?.stock !== undefined && quantity > item.stock)) return
    set((state) => ({
      items: state.items.map((item) =>
        item.product === productId
          ? { ...item, quantity, subtotal: Math.round(item.price * quantity * 100) / 100 }
          : item
      )
    }))
    get().updateTotal()
  },

  updateTotal: () => {
    set((state) => {
      const pricedItems = state.items.map((item, index) => {
        const base = item.originalPrice ?? item.price
        const itemDiscount = state.itemPromotions.find(p => p.itemIndex === index)?.discountPercentage || 0
        const itemPrice = Math.round(base * (1 - itemDiscount / 100) * 100) / 100
        const price = Math.round(itemPrice * (1 - (state.promotionCode ? state.discount : 0) / 100) * 100) / 100
        return { ...item, originalPrice: base, price, subtotal: Math.round(price * item.quantity * 100) / 100 }
      })
      // Calcular el subtotal usando los precios con descuento ya aplicados
      // Si los items tienen subtotal (que ya incluye el descuento), usamos ese valor
      // Si no, usamos price * quantity
      const itemsTotal = pricedItems.reduce(
        (sum, item) => sum + (item.subtotal ?? item.price * item.quantity),
        0
      )

      // Calcular el subtotal de combos
      const combosTotal = state.combos.reduce(
        (sum, combo) => sum + (combo.price || 0) * combo.quantity,
        0
      )

      // Sumar ambos subtotales
      const newTotal = Math.round((itemsTotal + combosTotal) * 100) / 100

      // Calcular el total pagado
      const paymentAmounts = state.selectedMethods.length === 1
        ? { [state.selectedMethods[0]]: newTotal } : state.paymentAmounts
      const totalPaid = state.selectedMethods.reduce((sum, method) => sum + (paymentAmounts[method] || 0), 0)

      return {
        items: pricedItems,
        total: newTotal,
        paymentAmounts,
        remaining:
          state.selectedMethods.length === 0
            ? newTotal
            : +(newTotal - totalPaid).toFixed(2)
      }
    })
  },

  setPayments: (payments) => set({ payments }),
  setInvoice: (invoice) => {
    set((state) => ({
      invoice: {
        ...state.invoice,
        ...invoice
      }
    }))
  },
  setNotes: (notes) => set({ notes }),

  setSelectedMethods: (methods) => {
    const unique = [...new Set(methods)]
    set(state => ({ selectedMethods: unique,
      paymentAmounts: Object.fromEntries(unique.map(method => [method, unique.length === 1 ? state.total : state.paymentAmounts[method] || 0])),
      paymentBanks: Object.fromEntries(Object.entries(state.paymentBanks).filter(([key]) => unique.includes(key as PaymentType))),
      transferData: unique.includes('TRANSFER') ? state.transferData : {},
      paymentDetails: unique.includes('ACCOUNT_PAYABLE') ? state.paymentDetails : {}
    }))
    get().calculateRemaining()
  },

  updatePaymentAmount: (method, amount) => {
    if (!Number.isFinite(amount) || amount < 0) return
    set((state) => ({
      paymentAmounts: {
        ...state.paymentAmounts,
        [method]: Math.round(amount * 100) / 100
      }
    }))
    get().calculateRemaining()
  },

  calculateRemaining: () => {
    const totalPaid = get().selectedMethods.reduce((sum, method) => sum + (get().paymentAmounts[method] || 0), 0)
    const remaining = Math.round((get().total - totalPaid) * 100) / 100
    set({ remaining })
    return remaining
  },

  clearPayments: () => {
    set({
      selectedMethods: [],
      paymentAmounts: {},
      transferData: {},
      paymentBanks: {},
      paymentDetails: {},
      remaining: get().total
    })
  },

  setPaymentBank: (method, bankId) => {
    set((state) => {
      const next = { ...state.paymentBanks }
      if (bankId) next[method] = bankId
      else delete next[method]
      return { paymentBanks: next }
    })
  },

  getPaymentBank: (method) => get().paymentBanks[method],

  updateTransferData: (method, data) => {
    set((state) => ({
      transferData: {
        ...state.transferData,
        [method]: data
      }
    }))
  },

  getTransferData: (method) => {
    return get().transferData[method] || {}
  },

  updatePaymentDetails: (method, details) => {
    set((state) => ({
      paymentDetails: {
        ...state.paymentDetails,
        [method]: details
      }
    }))
  },

  getPaymentDetails: (method) => {
    return get().paymentDetails[method] || {}
  },

  setPromotionCode: (code) => {
    set({ promotionCode: code })
    if (!code) {
      get().setDiscount(0)
      get().updateTotal()
    }
  },

  removeGlobalPromotion: () => {
    set({ promotionCode: '', discount: 0 })
    get().updateTotal()
  },
  addItemPromotion: (itemIndex, promotionCode, percentage) => {
    set(state => ({ itemPromotions: [...state.itemPromotions.filter(p => p.itemIndex !== itemIndex),
      { itemIndex, promotionCode, discountPercentage: percentage || 0 }] }))
    get().updateTotal()
  },
  removeItemPromotion: (itemIndex) => {
    set(state => ({ itemPromotions: state.itemPromotions.filter(p => p.itemIndex !== itemIndex) }))
    get().updateTotal()
  },

  addCombo: (combo) => {
    set((state) => ({
      combos: [...state.combos, combo]
    }))
    get().updateTotal()
  },

  removeCombo: (comboId) => {
    set((state) => ({
      combos: state.combos.filter((c) => c.comboId !== comboId)
    }))
    get().updateTotal()
  },

  updateComboQuantity: (comboId, quantity) => {
    if (!Number.isInteger(quantity) || quantity <= 0) return
    set((state) => ({
      combos: state.combos.map((combo) =>
        combo.comboId === comboId ? { ...combo, quantity } : combo
      )
    }))
    get().updateTotal()
  },

  clearSale: () => {
    set({
      items: [],
      payments: [],
      invoice: {
        type: 'TICKET',
        pointOfSale: 1
      },
      notes: '',
      total: 0,
      selectedMethods: [],
      paymentAmounts: {},
      paymentBanks: {},
      transferData: {},
      paymentDetails: {},
      // Limpiar también los nuevos campos
      promotionCode: '',
      itemPromotions: [],
      combos: [],
      discount: 0,
      promotionCustomerData: null
    })

    set((state) => ({
      remaining: state.total
    }))
  },

  createSale: async (cashRegisterId) => {
    const {
      items,
      payments,
      invoice,
      notes,
      promotionCode,
      itemPromotions,
      combos,
      promotionCustomerData
    } = get()

    // Los payments ya vienen armados desde handleInvoiceSubmit con bank, surcharge,
    // transferData y customerInfo. Usamos esos directamente.
    if (!payments || payments.length === 0) {
      throw new Error('No hay pagos configurados. Volvé al paso de pagos.')
    }

    // Crear la venta
    const sale: CreateSale = {
      items,
      payments,
      invoice: {
        ...invoice,
        type: invoice.type === 'TICKET' ? 'X' : invoice.type
      },
      notes,
      cashRegister: cashRegisterId,
      // Incluir nuevos campos si tienen valores
      ...(promotionCode && { promotionCode }),
      ...(itemPromotions.length > 0 && { itemPromotions }),
      ...(combos.length > 0 && { combos }),
      ...(promotionCustomerData && { promotionCustomerData })
    }

    try {
      const response = await api.post('/sales', sale)
      return response.data
    } catch (err: any) {
      // Re-lanzamos un error con el message del backend para que el caller lo
      // muestre en el toast. Axios pone los detalles en err.response.data.
      const backendError = err?.response?.data
      const message =
        backendError?.details ||
        backendError?.error ||
        err?.message ||
        'Error desconocido al crear la venta'
      const enriched = new Error(message)
      ;(enriched as any).status = err?.response?.status
      ;(enriched as any).label = backendError?.error
      throw enriched
    }
  },

  setDiscount: (percentage) => {
    set({ discount: percentage })
    get().updateTotal()
  },

  replaceItems: (items) => {
    set({ items })
    get().updateTotal()
  },

  setPromotionCustomerData: (data) => {
    set({ promotionCustomerData: data })
  },

  clearPromotionCustomerData: () => {
    set({ promotionCustomerData: null })
  },

  registerPromotionUsage: async (saleId) => {
    const { promotionCustomerData } = get()

    if (!promotionCustomerData) {
      console.log('No hay datos de promoción para registrar')
      return
    }

    try {
      const response = await api.post('/promotions/register-usage', {
        promotionCode: promotionCustomerData.promotionCode,
        customer: promotionCustomerData.customer,
        discountInfo: promotionCustomerData.discountInfo,
        saleId: saleId,
        notes: `Venta con promoción aplicada`,
        pointOfSale: 1
      })

      console.log('Promoción registrada exitosamente:', response.data)

      // Limpiar los datos de promoción después del registro exitoso
      get().clearPromotionCustomerData()

      return response.data
    } catch (error) {
      console.error('Error al registrar uso de promoción:', error)
      // No lanzamos el error para que no afecte la venta
      // Pero mantenemos los datos por si se quiere reintentar
    }
  }
}))
