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

  // Nuevos campos para promociones y combos
  promotionCode: string
  itemPromotions: ItemPromotion[]
  combos: Combo[]
  discount: number

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

  // Nuevas acciones para promociones y combos
  setPromotionCode: (code: string) => void
  addItemPromotion: (itemIndex: number, promotionCode: string) => void
  removeItemPromotion: (itemIndex: number) => void
  addCombo: (combo: Combo) => void
  removeCombo: (comboId: string) => void
  updateComboQuantity: (comboId: string, quantity: number) => void
  setDiscount: (percentage: number) => void
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
  promotionCode: '',
  itemPromotions: [],
  combos: [],
  discount: 0,

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
      // Calcular el subtotal de productos con promociones individuales aplicadas
      const itemsTotal = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      // Calcular el subtotal de combos
      const combosTotal = state.combos.reduce(
        (sum, combo) => sum + (combo.price || 0) * combo.quantity,
        0
      )

      // Sumar ambos subtotales
      let newTotal = itemsTotal + combosTotal

      // Si hay código de promoción global, aplicar descuento
      if (state.promotionCode) {
        const discountPercentage = state.discount || 0
        const discountAmount = (newTotal * discountPercentage) / 100
        newTotal = +(newTotal - discountAmount).toFixed(2) // Redondear a dos decimales
      }

      // También actualizar el remaining si no hay pagos o si todos los pagos son 0
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
      remaining: get().total
    })
  },

  setPromotionCode: (code) => {
    set({ promotionCode: code })
    // Si se elimina el código, eliminar el descuento
    if (!code) {
      get().setDiscount(0)
    }
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

  removeItemPromotion: (itemIndex) =>
    set((state) => ({
      itemPromotions: state.itemPromotions.filter(
        (p) => p.itemIndex !== itemIndex
      )
    })),

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
      // Limpiar también los nuevos campos
      promotionCode: '',
      itemPromotions: [],
      combos: [],
      discount: 0
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
      combos
    } = get()

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
      ...(combos.length > 0 && { combos })
    }

    const response = await api.post('/sales', sale)
    return response.data
  },

  setDiscount: (percentage) => {
    set({ discount: percentage })
    get().updateTotal()
  }
}))
