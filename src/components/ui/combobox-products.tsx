import { useEffect, useMemo, useState } from 'react'
import { ChevronsUpDown, Check } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu'
import { Input } from './input'

interface Product {
  _id: string
  name: string
  code: string
  stock?: number
  price?: number
  supplier?: any
  description?: string
  [key: string]: any
}

interface ComboboxProductsProps {
  products: Product[]
  value: string
  onChange: (value: string, product?: Product) => void
  onSearch?: (value: string) => void
  isSearching?: boolean
}

export function ComboboxProducts({
  products,
  value,
  onChange,
  onSearch,
  isSearching = false
}: ComboboxProductsProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // Asegurar que tenemos un array seguro de productos
  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products : []
  }, [products])

  // Producto seleccionado actualmente
  const selectedProduct = useMemo(() => {
    return safeProducts.find((product) => product?._id === value)
  }, [safeProducts, value])

  useEffect(() => {
    if (!open || !onSearch) return

    const timeout = window.setTimeout(() => {
      onSearch(inputValue.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [inputValue, onSearch, open])

  // Filtrar productos según el término de búsqueda
  const filteredProducts = useMemo(() => {
    if (onSearch) {
      return safeProducts
    }

    if (!inputValue.trim()) {
      return safeProducts
    }

    const lowercaseSearchTerm = inputValue.toLowerCase()
    return safeProducts.filter(
      (product) =>
        (typeof product?.name === 'string' &&
          product.name.toLowerCase().includes(lowercaseSearchTerm)) ||
        (typeof product?.code === 'string' &&
          product.code.toLowerCase().includes(lowercaseSearchTerm))
    )
  }, [safeProducts, inputValue, onSearch])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {value && selectedProduct
            ? `${selectedProduct.code} - ${selectedProduct.name}`
            : 'Seleccionar producto...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[--radix-dropdown-menu-trigger-width] p-0'>
        <div className='flex flex-col gap-1 p-2'>
          <Input
            type='text'
            placeholder='Buscar producto...'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className='h-9'
          />
          <div className='max-h-[300px] overflow-auto space-y-1'>
            {isSearching ? (
              <div className='text-sm text-muted-foreground text-center py-2'>
                Buscando productos...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='text-sm text-muted-foreground text-center py-2'>
                No se encontraron productos.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <DropdownMenuItem
                  key={product._id}
                  onSelect={() => {
                    onChange(product._id, product)
                    setOpen(false)
                  }}
                  className={`flex items-start gap-2 ${
                    product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={product.stock === 0}
                >
                  {value === product._id && (
                    <Check className='h-4 w-4 opacity-100' />
                  )}
                  <span className='flex-grow cursor-pointer'>
                    {product.code} - {product.name}
                    {product.stock !== undefined &&
                      ` (Stock: ${product.stock})`}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
