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

  // Acciones para detalles de pago
  updatePaymentDetails: (method: PaymentType, details: any) => void
  getPaymentDetails: (method: PaymentType) => any

  // Nuevas acciones para promociones y combos
  setPromotionCode: (code: string) => void
  removeGlobalPromotion: () => void
  addItemPromotion: (itemIndex: number, promotionCode: string) => void
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
    set((state) => ({
      items: state.items.filter((item) => item.product !== productId)
    }))
    get().updateTotal()
  },

  updateItemQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product === productId
          ? { ...item, quantity, subtotal: item.price * quantity }
          : item
      )
    }))
    get().updateTotal()
  },

  updateTotal: () => {
    set((state) => {
      // Calcular el subtotal usando los precios con descuento ya aplicados
      // Si los items tienen subtotal (que ya incluye el descuento), usamos ese valor
      // Si no, usamos price * quantity
      const itemsTotal = state.items.reduce(
        (sum, item) => sum + (item.subtotal || item.price * item.quantity),
        0
      )

      // Calcular el subtotal de combos
      const combosTotal = state.combos.reduce(
        (sum, combo) => sum + (combo.price || 0) * combo.quantity,
        0
      )

      // Sumar ambos subtotales
      const newTotal = itemsTotal + combosTotal

      // Calcular el total pagado
      const totalPaid = Object.values(state.paymentAmounts).reduce(
        (sum, amount) => sum + (amount || 0),
        0
      )

      return {
        total: newTotal,
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
    set({ selectedMethods: methods })
    // Si solo hay un método, asignar el total
    if (methods.length === 1) {
      get().updatePaymentAmount(methods[0], get().total)
    }
  },

  updatePaymentAmount: (method, amount) => {
    set((state) => ({
      paymentAmounts: {
        ...state.paymentAmounts,
        [method]: amount
      }
    }))
    get().calculateRemaining()
  },

  calculateRemaining: () => {
    const totalPaid = Object.values(get().paymentAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    )
    const remaining = get().total - totalPaid
    set({ remaining })
    return remaining
  },

  clearPayments: () => {
    set({
      selectedMethods: [],
      paymentAmounts: {},
      transferData: {},
      paymentDetails: {},
      remaining: get().total
    })
  },

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
    // Restaurar items - eliminar descuentos
    const items = get().items.map((item) => {
      // Si el item tiene precio original, restaurarlo
      console.log(item)
      if (item.originalPrice) {
        return {
          ...item,
          price: item.originalPrice,
          subtotal: item.originalPrice * item.quantity,
          // Eliminar propiedades de descuento
          originalPrice: undefined,
          discountAmount: undefined,
          discountPercentage: undefined,
          discounted: undefined
        }
      }
      return item
    })

    // Actualizar el store de una sola vez
    set({
      items,
      promotionCode: '',
      discount: 0
    })

    get().updateTotal()
  },

  addItemPromotion: (itemIndex, promotionCode) =>
    set((state) => {
      const existingPromoIndex = state.itemPromotions.findIndex(
        (p) => p.itemIndex === itemIndex
      )
      const newPromotions = [...state.itemPromotions]

      if (existingPromoIndex >= 0) {
        // Actualizar promoción existente
        newPromotions[existingPromoIndex] = { itemIndex, promotionCode }
      } else {
        // Agregar nueva promoción
        newPromotions.push({ itemIndex, promotionCode })
      }

      return { itemPromotions: newPromotions }
    }),

  removeItemPromotion: (itemIndex) => {
    // Obtener el item actual
    const items = get().items
    const itemToRestore = items[itemIndex]

    // Si el item tiene precio original, restaurarlo
    if (itemToRestore && itemToRestore.originalPrice) {
      const updatedItems = [...items]
      updatedItems[itemIndex] = {
        ...itemToRestore,
        price: itemToRestore.originalPrice,
        subtotal: itemToRestore.originalPrice * itemToRestore.quantity,
        // Eliminar propiedades de descuento
        originalPrice: undefined,
        discountAmount: undefined,
        discountPercentage: undefined,
        discounted: undefined
      }

      // Actualizar los items
      get().replaceItems(updatedItems)
    }

    // Eliminar la promoción del registro
    set((state) => ({
      itemPromotions: state.itemPromotions.filter(
        (p) => p.itemIndex !== itemIndex
      )
    }))
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
      selectedMethods,
      paymentAmounts,
      transferData,
      paymentDetails,
      promotionCustomerData
    } = get()

    // Construir los pagos con todos los detalles
    const paymentsWithDetails = selectedMethods.map((method) => {
      const basePayment = {
        method: method,
        amount: paymentAmounts[method] || 0
      }

      // Agregar datos específicos del método
      if (method === 'TRANSFER') {
        const transferInfo = transferData[method] || {}
        return {
          ...basePayment,
          customerPhone: transferInfo.customerPhone,
          transferReference: transferInfo.transferReference
        }
      }

      if (method === 'ACCOUNT_PAYABLE') {
        const accountInfo = paymentDetails[method] || {}
        return {
          ...basePayment,
          accountPayableId: accountInfo.accountPayableId,
          customerInfo: accountInfo.customerInfo
        }
      }

      return basePayment
    })

    // Crear la venta
    const sale: CreateSale = {
      items,
      payments: paymentsWithDetails,
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

    const response = await api.post('/sales', sale)
    return response.data
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
