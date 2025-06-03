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
              {items.map((item) => {
                const hasItemPromotion = itemPromotions?.some(
                  (p) => p.productId === item.product._id
                )
                const itemPromotion = hasItemPromotion
                  ? itemPromotions?.find(
                    (p) => p.productId === item.product._id
                  )
                  : null

                return (
                  <TableRow key={item._id}>
                    <TableCell className='font-medium text-xs sm:text-sm'>
                      {item.product.code}
                    </TableCell>
                    <TableCell className='text-xs sm:text-sm'>
                      <div className='min-w-0'>
                        <div className='truncate'>{item.product.name}</div>
                        {hasItemPromotion && (
                          <Badge
                            variant='outline'
                            className='mt-1 bg-green-50 text-green-700 border-green-200 text-xs'
                          >
                            {itemPromotion?.code || 'Descuento'} (
                            {itemPromotion?.discountPercentage}%)
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
                            itemPromotion?.originalPrice || item.product.price
                          )}
                        </span>
                      ) : (
                        formatCurrency(item.product.price)
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
