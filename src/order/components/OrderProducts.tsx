import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table'
import { OrderItem } from './types'

interface OrderProductsProps {
  items: OrderItem[]
}

const OrderProducts = ({ items }: OrderProductsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Package className='mr-2 h-5 w-5' />
          Productos Solicitados
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
                <TableHead className='text-right'>Stock Actual</TableHead>
                <TableHead className='text-right'>Stock Mínimo</TableHead>
                <TableHead className='text-right'>Precio Unitario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => {
                const product = item.product as any
                return (
                  <TableRow key={item._id || `item-${idx}`}>
                    <TableCell className='font-medium'>
                      {product?.code || <span className='text-muted-foreground'>—</span>}
                    </TableCell>
                    <TableCell>
                      {product?.name || (
                        <span className='italic text-muted-foreground'>
                          Producto eliminado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>{item.quantity}</TableCell>
                    <TableCell className='text-right'>
                      {item.currentStock}
                    </TableCell>
                    <TableCell className='text-right'>
                      {item.minimumStock}
                    </TableCell>
                    <TableCell className='text-right'>
                      {product?.price !== undefined ? `$${product.price}` : '—'}
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

export default OrderProducts
