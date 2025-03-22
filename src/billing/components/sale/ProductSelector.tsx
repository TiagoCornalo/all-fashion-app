import { useState, useEffect } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Input,
  Button
} from '../../../components'
import { Product } from '../../../types/inventory.types'
import { SaleItem } from '../../../types/sale.types'
import { Search, Plus, Minus, Trash } from 'lucide-react'
import { useDebounce } from '../../../hooks/useDebounce'
import api from '../../../services/config/axios'
import { PromotionItemModal } from '.'

const ProductSelector = () => {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    itemPromotions,
    addItemPromotion,
    removeItemPromotion
  } = useSaleStore()

  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  )

  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedSearch) {
        setProducts([])
        return
      }

      try {
        setLoading(true)
        const response = await api.get(
          `/products?search=${debouncedSearch}&pageSize=5`
        )
        setProducts(response.data.data)
      } catch (error) {
        console.error('Error buscando productos:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedSearch])

  const handleAddProduct = (product: Product) => {
    const existingItem = items.find((item) => item.product === product._id)

    if (existingItem) {
      updateItemQuantity(product._id, existingItem.quantity + 1)
    } else {
      const newItem: SaleItem = {
        product: product._id,
        quantity: 1,
        price: product.price,
        name: product.name,
        subtotal: product.price
      }
      addItem(newItem)
    }

    setSearch('')
    setProducts([])
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId)
    } else {
      updateItemQuantity(productId, newQuantity)
    }
  }

  // Función para aplicar promoción a un ítem específico
  const handleApplyPromotion = (index: number) => {
    setSelectedItemIndex(index)
    setIsPromotionModalOpen(true)
  }

  // Función para aplicar el código de promoción validado
  const applyPromotionCode = (index: number, code: string) => {
    addItemPromotion(index, code)
  }

  // Función para determinar si un ítem tiene promoción aplicada
  const hasPromotion = (index: number) => {
    return itemPromotions.some((p) => p.itemIndex === index)
  }

  // Función para quitar promoción de un ítem
  const handleRemovePromotion = (index: number) => {
    removeItemPromotion(index)
  }

  return (
    <div className='max-h-[60vh] overflow-y-auto'>
      <div className='space-y-4'>
        {/* Buscador de productos */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Buscar productos...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>

        {/* Lista de productos encontrados */}
        {loading ? (
          <div>Buscando productos...</div>
        ) : (
          search && (
            <div className='border rounded-md max-h-48 overflow-y-auto'>
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`p-2 hover:bg-accent cursor-pointer flex justify-between items-center ${
                    product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => handleAddProduct(product)}
                >
                  <div>
                    <div>{product.name}</div>
                    <div className='text-sm text-muted-foreground'>
                      Stock: {product.stock} {product.stock === 0 && 'Agotado'}
                    </div>
                  </div>
                  <div className='font-medium'>${product.price}</div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tabla de productos seleccionados */}
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Promoción</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.product}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <div className='flex items-center space-x-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() =>
                          handleQuantityChange(item.product, item.quantity - 1)
                        }
                      >
                        <Minus className='h-4 w-4' />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() =>
                          handleQuantityChange(item.product, item.quantity + 1)
                        }
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>${item.price}</TableCell>
                  <TableCell>${item.price * item.quantity}</TableCell>
                  <TableCell>
                    {hasPromotion(index) ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRemovePromotion(index)}
                        className='text-red-500 hover:text-red-700'
                      >
                        Quitar promo
                      </Button>
                    ) : (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleApplyPromotion(index)}
                      >
                        Aplicar promo
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => removeItem(item.product)}
                    >
                      <Trash className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal para promociones */}
      {selectedItemIndex !== null && (
        <PromotionItemModal
          isOpen={isPromotionModalOpen}
          onOpenChange={setIsPromotionModalOpen}
          itemIndex={selectedItemIndex}
          itemName={items[selectedItemIndex]?.name || ''}
          onApplyPromotion={applyPromotionCode}
        />
      )}
    </div>
  )
}

export default ProductSelector
