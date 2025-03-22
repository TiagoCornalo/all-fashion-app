import { Badge } from '../../components/ui/badge'
import { getOrderStatusLabel, getOrderStatusColor } from './utils'

interface OrderHeaderProps {
  status: string
}

const OrderHeader = ({ status }: OrderHeaderProps) => {
  return (
    <div className='flex justify-between items-center'>
      <h1 className='text-2xl font-bold'>Detalle de Orden</h1>
      <Badge className={getOrderStatusColor(status)}>
        {getOrderStatusLabel(status)}
      </Badge>
    </div>
  )
}

export default OrderHeader
