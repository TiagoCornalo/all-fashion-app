import { createContext, useContext, ReactNode } from 'react'

interface InventoryContextType {
  refreshTable: () => void | Promise<void>
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

interface InventoryProviderProps {
  children: ReactNode
  onRefresh: () => void | Promise<void>
}

export function InventoryProvider({ children, onRefresh }: InventoryProviderProps) {
  return (
    <InventoryContext.Provider value={{ refreshTable: onRefresh }}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error('useInventory debe usarse dentro de un InventoryProvider')
  }
  return context
}
