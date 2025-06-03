import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Tag } from 'lucide-react'
import { formatDate } from './utils'
import { Sale } from '../../types/sale.types'
import { Link } from 'react-router-dom'

interface SaleGeneralProps {
  sale: Sale
}

const SaleGeneral = ({ sale }: SaleGeneralProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <Tag className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3 sm:space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>ID de Venta</p>
            <p className='font-medium text-sm sm:text-base break-all'>{sale._id}</p>
          </div>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>Vendedor</p>
            <p className='font-medium text-sm sm:text-base'>
              {sale.seller?.name || 'No especificado'}
            </p>
          </div>
          <div>
            <p className='text-xs sm:text-sm text-gray-500'>Fecha</p>
            <p className='font-medium text-sm sm:text-base'>{formatDate(sale.createdAt)}</p>
          </div>
          <Link to={`/cash-registers/${sale.cashRegister?._id}`}>
            <div>
              <p className='text-xs sm:text-sm text-gray-500'>Caja</p>
              <p className='font-medium text-sm sm:text-base hover:underline'>
                {sale.cashRegister?._id
                  ? `#${sale.cashRegister._id.substring(0, 8)}`
                  : 'No especificada'}
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleGeneral
