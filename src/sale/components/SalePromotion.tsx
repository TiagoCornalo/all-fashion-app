import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Percent } from 'lucide-react'
import { formatCurrency } from '../../utils'

interface SalePromotionProps {
  promotion: {
    code: string
    discountPercentage: number
    discountAmount: number
    applied: string
  }
}

const SalePromotion = ({ promotion }: SalePromotionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Percent className='mr-2 h-5 w-5' />
          Promoción Global Aplicada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>Código</p>
            <p className='font-medium'>{promotion.code}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Porcentaje</p>
            <p className='font-medium'>{promotion.discountPercentage}%</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Descuento Total</p>
            <p className='font-medium text-green-600'>
              -{formatCurrency(promotion.discountAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalePromotion
