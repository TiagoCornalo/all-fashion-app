import { create } from 'zustand'
import { SaleItem, Payment, Invoice, CreateSale } from '../types/sale.types'
import api from '../services/config/axios'

interface SaleStore {
  items: SaleItem[]
  payments: Payment[]
  invoice: Invoice
  notes: string
  total: number

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
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  items: [],
  payments: [],
  invoice: {
    type: 'TICKET'
  },
  notes: '',
  total: 0,

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
        item.product === productId ? { ...item, quantity } : item
      )
    }))
    get().updateTotal()
  },

  updateTotal: () => {
    set((state) => ({
      total: state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    }))
  },

  setPayments: (payments) => set({ payments }),
  setInvoice: (invoice) => set({ invoice }),
  setNotes: (notes) => set({ notes }),

  clearSale: () => set({
    items: [],
    payments: [],
    invoice: { type: 'TICKET' },
    notes: '',
    total: 0
  }),

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