import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { ClipboardList } from 'lucide-react'
import { formatDate, getOrderSourceLabel } from './utils'
import { Order } from './types'

interface OrderGeneralProps {
  order: Order
}

const OrderGeneral = ({ order }: OrderGeneralProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <ClipboardList className='mr-2 h-5 w-5' />
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>ID de Orden</p>
            <p className='font-medium'>{order._id}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Origen</p>
            <p className='font-medium'>
              {getOrderSourceLabel(order.createdFrom)}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Fecha de creación</p>
            <p className='font-medium'>{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Última actualización</p>
            <p className='font-medium'>{formatDate(order.updatedAt)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Cantidad total</p>
            <p className='font-medium'>{order.totalQuantity} productos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderGeneral
