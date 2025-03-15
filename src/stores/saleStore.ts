import { create } from 'zustand'
import {
  SaleItem,
  Payment,
  Invoice,
  CreateSale,
  PaymentType
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
      const newTotal = state.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      // También actualizar el remaining si no hay pagos o si todos los pagos son 0
      const totalPaid = Object.values(state.paymentAmounts).reduce(
        (sum, amount) => sum + (amount || 0),
        0
      )

      return {
        total: newTotal,
        // Si no hay métodos seleccionados, remaining debe ser igual al total
        remaining:
          state.selectedMethods.length === 0 ? newTotal : newTotal - totalPaid
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
      paymentAmounts: {}
    })

    set((state) => ({
      remaining: state.total
    }))
  },

  createSale: async (cashRegisterId) => {
    const { items, payments, invoice, notes } = get()
    const sale: CreateSale = {
      items,
      payments,
      invoice,
      notes,
      cashRegister: cashRegisterId
    }

    const response = await api.post('/sales', sale)
    return response.data
  }
}))
