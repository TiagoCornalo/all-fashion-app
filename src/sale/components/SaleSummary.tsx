import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Separator } from '../../components/ui/separator'
import { formatCurrency } from '../../utils'

interface SaleSummaryProps {
  subtotal: number
  tax: number
  total: number
  promotion?: {
    discountPercentage: number
    discountAmount: number
  }
}

const SaleSummary = ({ subtotal, tax, total, promotion }: SaleSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <span className='text-gray-600'>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {promotion && (
            <div className='flex justify-between text-green-600'>
              <span>Descuento global ({promotion.discountPercentage}%):</span>
              <span>-{formatCurrency(promotion.discountAmount)}</span>
            </div>
          )}

          {tax > 0 && (
            <div className='flex justify-between'>
              <span className='text-gray-600'>Impuestos:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}

          <Separator />
          <div className='flex justify-between font-bold text-lg'>
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleSummary
