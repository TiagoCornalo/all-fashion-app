import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { ShoppingBag } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { formatCurrency } from '../../utils'
import { getEffectiveUsdRate } from '../../utils/usdPricing'
import { SaleItem } from '../../types/sale.types'

const USD_RATE_LABELS: Record<string, string> = {
  blue: 'Blue',
  oficial: 'Oficial',
  mep: 'MEP',
  tarjeta: 'Tarjeta'
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

type PopulatedSaleItem = Omit<SaleItem, 'product'> & {
  _id?: string
  product: {
    _id: string
    code?: string
    name?: string
  } | null
}

type ItemPromotion = {
  productId: string
  originalPrice?: number
  code?: string
  discountPercentage?: number
}

interface SaleProductsProps {
  items: PopulatedSaleItem[]
  itemPromotions?: ItemPromotion[]
}

const SaleProducts = ({ items, itemPromotions }: SaleProductsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <ShoppingBag className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Productos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-xs sm:text-sm'>Código</TableHead>
                <TableHead className='text-xs sm:text-sm'>Producto</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Cantidad</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Precio Original</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Precio Final</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => {
                // El producto puede ser null si fue eliminado de la DB después
                // de hacerse la venta (populate devuelve null).
                const product = item.product
                const productId = product?._id
                const hasItemPromotion = productId
                  ? itemPromotions?.some((p) => p.productId === productId)
                  : false
                const itemPromotion = hasItemPromotion
                  ? itemPromotions?.find((p) => p.productId === productId)
                  : null
                const productMissing = !product
                // El backend puede incluir solo { stale: false } en ventas en pesos.
                // Mostrar la conversión únicamente si sus importes están completos.
                const snapshot = item.pricingSnapshot
                const pricing = snapshot?.currency === 'USD' &&
                  Number.isFinite(snapshot.priceUSD) &&
                  Number.isFinite(snapshot.rateValue) &&
                  Number.isFinite(snapshot.calculatedPriceArs)
                  ? snapshot
                  : null
                const effectiveRate = pricing
                  ? pricing.effectiveRateValue ??
                    getEffectiveUsdRate(pricing.rateValue, pricing.surchargeArs)
                  : null
                const originalPrice = itemPromotion?.originalPrice ??
                  item.originalPrice ??
                  pricing?.calculatedPriceArs ??
                  item.price
                const rateTimestamp = formatDateTime(
                  pricing?.sourceUpdatedAt || pricing?.fetchedAt
                )

                return (
                  <TableRow key={item._id || `item-${idx}`}>
                    <TableCell className='font-medium text-xs sm:text-sm'>
                      {product?.code || (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='min-w-[260px] text-xs sm:text-sm'>
                      <div className='min-w-0'>
                        <div className='truncate'>
                          {product?.name || (
                            <span className='italic text-muted-foreground'>
                              Producto eliminado
                            </span>
                          )}
                        </div>
                        {hasItemPromotion && (
                          <Badge
                            variant='outline'
                            className='mt-1 bg-green-50 text-green-700 border-green-200 text-xs'
                          >
                            {itemPromotion?.code || 'Descuento'} (
                            {itemPromotion?.discountPercentage}%)
                          </Badge>
                        )}
                        {productMissing && (
                          <Badge
                            variant='outline'
                            className='mt-1 bg-amber-50 text-amber-700 border-amber-200 text-xs'
                          >
                            Sin referencia
                          </Badge>
                        )}
                        {pricing && (
                          <div className='mt-2 space-y-0.5 text-[11px] leading-4 text-muted-foreground'>
                            <div className='font-medium text-foreground/80'>
                              USD {pricing.priceUSD.toLocaleString('es-AR')} ×{' '}
                              {formatCurrency(effectiveRate ?? pricing.rateValue)} ={' '}
                              {formatCurrency(pricing.calculatedPriceArs)}
                            </div>
                            <div>
                              Dólar {USD_RATE_LABELS[pricing.rateType] || pricing.rateType}:{' '}
                              base {formatCurrency(pricing.rateValue)}
                              {pricing.surchargeArs > 0
                                ? ` + ajuste ${formatCurrency(pricing.surchargeArs)}`
                                : ''}
                              {' · '}Cotización aplicada:{' '}
                              {formatCurrency(effectiveRate ?? pricing.rateValue)}
                              {rateTimestamp ? ` · ${rateTimestamp}` : ''}
                            </div>
                            {(pricing.source || pricing.stale) && (
                              <div>
                                {pricing.source ? `Fuente: ${pricing.source}` : ''}
                                {pricing.source && pricing.stale ? ' · ' : ''}
                                {pricing.stale ? 'Último valor disponible' : ''}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      {item.quantity}
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      {hasItemPromotion ? (
                        <span className='line-through text-gray-500'>
                          {formatCurrency(originalPrice)}
                        </span>
                      ) : (
                        formatCurrency(originalPrice)
                      )}
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm font-medium'>
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleProducts
