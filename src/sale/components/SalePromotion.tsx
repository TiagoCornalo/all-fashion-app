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
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <Percent className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Promoción Global Aplicada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>Código</p>
            <p className='font-medium text-sm sm:text-base'>{promotion.code}</p>
          </div>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>Porcentaje</p>
            <p className='font-medium text-sm sm:text-base'>{promotion.discountPercentage}%</p>
          </div>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>Descuento Total</p>
            <p className='font-medium text-green-600 text-sm sm:text-base'>
              -{formatCurrency(promotion.discountAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalePromotion
