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

interface SaleProductsProps {
  items: any[]
  itemPromotions?: any[]
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

                return (
                  <TableRow key={item._id || `item-${idx}`}>
                    <TableCell className='font-medium text-xs sm:text-sm'>
                      {product?.code || (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm'>
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
                      </div>
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      {item.quantity}
                    </TableCell>
                    <TableCell className='text-right text-xs sm:text-sm'>
                      {hasItemPromotion ? (
                        <span className='line-through text-gray-500'>
                          {formatCurrency(
                            itemPromotion?.originalPrice ?? product?.price ?? item.price
                          )}
                        </span>
                      ) : (
                        formatCurrency(product?.price ?? item.price)
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
