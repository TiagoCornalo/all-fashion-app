import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Calculator } from 'lucide-react'
import { Separator } from '../../components/ui/separator'
import { OrderItem } from './types'

interface OrderSummaryProps {
  items: OrderItem[]
}

const OrderSummary = ({ items }: OrderSummaryProps) => {
  // Calcular el total estimado basado en los precios y cantidades.
  // El producto puede ser null si fue eliminado de la DB después del pedido.
  const totalAmount = items.reduce(
    (sum, item) => sum + ((item.product as any)?.price ?? 0) * item.quantity,
    0
  )

  // Calcular el total de productos
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Calculator className='mr-2 h-5 w-5' />
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Total Productos:</span>
            <span>{totalQuantity} unidades</span>
          </div>

          <div className='flex justify-between'>
            <span className='text-gray-600'>Valor Estimado:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className='flex justify-between font-bold text-lg'>
            <span>Total Estimado:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderSummary
