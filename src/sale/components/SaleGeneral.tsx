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
        <CardTitle className='flex items-center'>
          <Tag className='mr-2 h-5 w-5' />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>ID de Venta</p>
            <p className='font-medium'>{sale._id}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Vendedor</p>
            <p className='font-medium'>
              {sale.seller?.name || 'No especificado'}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Fecha</p>
            <p className='font-medium'>{formatDate(sale.createdAt)}</p>
          </div>
          <Link to={`/cash-registers/${sale.cashRegister?._id}`}>
            <p className='text-sm text-gray-500'>Caja</p>
            <p className='font-medium hover:underline'>
              {sale.cashRegister?._id
                ? `#${sale.cashRegister._id.substring(0, 8)}`
                : 'No especificada'}
            </p>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleGeneral
