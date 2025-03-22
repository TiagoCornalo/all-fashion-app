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
        <CardTitle className='flex items-center'>
          <ShoppingBag className='mr-2 h-5 w-5' />
          Productos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className='text-right'>Cantidad</TableHead>
                <TableHead className='text-right'>Precio Original</TableHead>
                <TableHead className='text-right'>Precio Final</TableHead>
                <TableHead className='text-right'>Subtotal</TableHead>
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
                    <TableCell className='font-medium'>
                      {item.product.code}
                    </TableCell>
                    <TableCell>
                      {item.product.name}
                      {hasItemPromotion && (
                        <Badge
                          variant='outline'
                          className='ml-2 bg-green-50 text-green-700 border-green-200'
                        >
                          {itemPromotion?.code || 'Descuento'} (
                          {itemPromotion?.discountPercentage}%)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.quantity}
                    </TableCell>
                    <TableCell className='text-right'>
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
                    <TableCell className='text-right'>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className='text-right'>
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
