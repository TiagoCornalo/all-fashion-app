import { create } from 'zustand'
import {
  getCurrentRegister,
  getLastClosedRegister,
  openRegister,
  closeRegister,
  deposit,
  withdraw
} from '../services/cash-register'

export interface CashRegister {
  _id: string
  date: Date
  initialBalance: number
  currentBalance: number
  status: 'OPEN' | 'CLOSED'
  openedAt: Date
  openedBy: {
    _id: string
    name: string
  }
  closedAt?: Date
  closedBy?: {
    _id: string
    name: string
  }
  movements: Array<{
    type: string
    amount: number
    createdAt: Date
    createdBy: {
      _id: string
      name: string
    }
    notes?: string
    saleDetails: {
      invoiceType: string
      invoiceNumber: string
      paymentMethods: string[]
    }
    reference: string
  }>
  closingSummary?: {
    expectedCash: number
    actualCash: number
    difference: number
    notes?: string
  }
  paymentSummary?: {
    method: string
    count: number
    total: number
  }[]
}

interface CashRegisterStore {
  currentRegister: CashRegister | null
  lastClosedRegister: CashRegister | null
  isLoading: boolean
  error: string | null
  fetchCurrentRegister: () => Promise<void>
  fetchLastClosedRegister: () => Promise<void>
  openRegister: (initialBalance: number) => Promise<void>
  closeRegister: (
    id: string,
    actualCash: number,
    notes?: string
  ) => Promise<void>
  deposit: (id: string, amount: number, notes?: string) => Promise<void>
  withdraw: (id: string, amount: number, notes?: string) => Promise<void>
}

export const useCashRegisterStore = create<CashRegisterStore>((set, get) => ({
  currentRegister: null,
  lastClosedRegister: null,
  isLoading: false,
  error: null,

  fetchCurrentRegister: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getCurrentRegister()
      set({ currentRegister: data })
    } catch (error) {
      console.error(error)
      set({ currentRegister: null })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchLastClosedRegister: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await getLastClosedRegister()
      set({ lastClosedRegister: data })
    } catch (error) {
      console.error(error)
      set({ lastClosedRegister: null })
    } finally {
      set({ isLoading: false })
    }
  },

  openRegister: async (initialBalance: number) => {
    set({ isLoading: true, error: null })
    try {
      const data = await openRegister(initialBalance)
      set({ currentRegister: data })
      await get().fetchCurrentRegister()
      return data
    } catch (error) {
      console.error(error)
      set({ error: 'Error al abrir la caja', currentRegister: null })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  closeRegister: async (id: string, actualCash: number, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await closeRegister(id, actualCash, notes)
      set({ currentRegister: null })
      await get().fetchCurrentRegister()
      return data
    } catch (error) {
      console.error(error)
      set({ error: 'Error al cerrar la caja' })
    } finally {
      set({ isLoading: false })
    }
  },

  deposit: async (id: string, amount: number, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await deposit(id, amount, notes)
      set({ currentRegister: data })
    } catch (error) {
      console.error(error)
      set({ error: 'Error al realizar el depósito' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  withdraw: async (id: string, amount: number, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await withdraw(id, amount, notes)
      set({ currentRegister: data })
    } catch (error) {
      console.error(error)
      set({ error: 'Error al realizar el retiro' })
      throw error
    } finally {
      set({ isLoading: false })
    }
  }
}))
