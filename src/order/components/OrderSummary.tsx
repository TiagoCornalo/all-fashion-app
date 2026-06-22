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
  const totals = items.reduce(
    (acc, item) => {
      const currency = item.costCurrency || 'ARS'
      acc[currency] += (item.unitCost || 0) * item.quantity
      return acc
    },
    { ARS: 0, USD: 0 }
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

          {totals.ARS > 0 && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>Costo estimado ARS:</span>
              <span>${totals.ARS.toLocaleString('es-AR')}</span>
            </div>
          )}
          {totals.USD > 0 && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>Costo estimado USD:</span>
              <span>USD {totals.USD.toLocaleString('es-AR')}</span>
            </div>
          )}

          <Separator />

          <p className='text-xs text-muted-foreground'>
            Los costos en pesos y dólares se muestran separados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderSummary
