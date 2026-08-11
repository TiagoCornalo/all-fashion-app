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
  Button,
  Badge
} from '../../../components'
import { Product } from '../../../types/inventory.types'
import { SaleItem } from '../../../types/sale.types'
import { Search, Plus, Minus, Trash, ScanBarcode } from 'lucide-react'
import { useDebounce } from '../../../hooks/useDebounce'
import api from '../../../services/config/axios'
import { PromotionItemModal } from '.'
import { toast } from 'react-toastify'
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner'
import { findProductByBarcode } from '../../../services/barcode.service'
import { AxiosError } from 'axios'

const formatArs = (value?: number | null) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const USD_RATE_LABELS: Record<string, string> = {
  blue: 'dólar blue',
  oficial: 'dólar oficial',
  mep: 'dólar MEP',
  tarjeta: 'dólar tarjeta'
}

const getPricingLabel = (product: Product | SaleItem) => {
  const priceUSD = 'priceUSD' in product ? product.priceUSD : undefined
  const usdRateType = 'usdRateType' in product ? product.usdRateType : undefined

  if (!priceUSD || priceUSD <= 0) return 'Precio final'

  return `Precio final con ${USD_RATE_LABELS[usdRateType || 'blue'] || 'dólar'}`
}

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
        const response = await api.get('/products', {
          params: {
            search: debouncedSearch,
            page: 1,
            pageSize: 100,
            sortBy: 'name',
            sortOrder: 'asc'
          }
        })
        setProducts(Array.isArray(response.data.data) ? response.data.data : [])
      } catch (error) {
        console.error('Error buscando productos:', error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedSearch])

  const handleAddProduct = (product: Product, requestedQuantity = 1) => {
    if ((product.stock ?? 0) <= 0) {
      toast.error(`"${product.name}" no tiene stock disponible`)
      return
    }

    const existingItem = items.find((item) => item.product === product._id)
    const nextQuantity = (existingItem?.quantity || 0) + requestedQuantity

    if (nextQuantity > (product.stock || 0)) {
      toast.error(
        `Stock insuficiente para "${product.name}". Disponible: ${product.stock || 0}`
      )
      return
    }

    if (existingItem) {
      updateItemQuantity(product._id, nextQuantity)
    } else {
      const newItem: SaleItem = {
        product: product._id,
        quantity: requestedQuantity,
        price: product.price,
        name: product.name,
        subtotal: product.price * requestedQuantity,
        stock: product.stock,
        priceUSD: product.priceUSD,
        usdRateType: product.usdRateType
      }
      addItem(newItem)
    }

    setSearch('')
    setProducts([])
  }

  const handleScannedCode = async (value: string) => {
    try {
      const result = await findProductByBarcode(value)
      const units = Math.max(1, Number(result.barcode.unitsPerScan || 1))
      handleAddProduct(result.product, units)
    } catch (error) {
      const message = error instanceof AxiosError
        ? error.response?.data?.error || error.response?.data?.details
        : 'No pudimos identificar el código escaneado'
      toast.error(message)
    }
  }

  useBarcodeScanner({ onScan: handleScannedCode })

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
      <div className='space-y-4 p-1'>
        {/* Buscador de productos */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Buscar o escanear producto...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && search.trim()) {
                  event.preventDefault()
                  void handleScannedCode(search)
                }
              }}
              className='pl-8'
            />
          </div>
          <Badge variant='outline' className='h-9 justify-center gap-2 rounded-md px-3 font-normal'>
            <ScanBarcode className='h-4 w-4' />
            Lector activo
          </Badge>
        </div>

        {/* Lista de productos encontrados */}
        {loading ? (
          <div>Buscando productos...</div>
        ) : (
          search && (
            <div className='border rounded-md max-h-72 overflow-y-auto'>
              {products.length === 0 ? (
                <div className='p-3 text-sm text-muted-foreground'>
                  No encontramos productos con esa búsqueda. Probá por código,
                  marca o una parte del nombre.
                </div>
              ) : (
                products.map((product) => {
                  const hasStock = (product.stock ?? 0) > 0

                  return (
                    <button
                      key={product._id}
                      type='button'
                      className={`w-full p-2 text-left hover:bg-accent flex justify-between items-center gap-3 ${
                        hasStock ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => handleAddProduct(product)}
                      disabled={!hasStock}
                    >
                      <div className='min-w-0'>
                        <div className='font-medium truncate'>{product.name}</div>
                        <div className='text-sm text-muted-foreground'>
                          {product.code ? `${product.code} · ` : ''}
                          Stock: {product.stock ?? 0}
                          {!hasStock && ' · Agotado'}
                        </div>
                      </div>
                      <div className='font-medium shrink-0'>
                        <div className='text-right'>{formatArs(product.price)}</div>
                        <div className='text-[11px] font-normal text-muted-foreground'>
                          {getPricingLabel(product)}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
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
                        disabled={item.quantity >= (item.stock || 0)}
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{formatArs(item.price)}</div>
                    <div className='text-[11px] text-muted-foreground'>
                      {getPricingLabel(item)}
                    </div>
                  </TableCell>
                  <TableCell>{formatArs(item.price * item.quantity)}</TableCell>
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
