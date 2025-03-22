import { LayoutMultiRole } from '../layout'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrderById } from '../services/order'
import { Loader } from '../components'
import { Card, CardContent } from '../components/ui/card'
import {
  OrderHeader,
  OrderGeneral,
  OrderSupplier,
  OrderProducts,
  OrderNotes,
  OrderSummary
} from './components'
import { Order } from './components/types'

const OrderContainer = () => {
  const { id } = useParams()
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id ?? '')
  })

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton
    >
      <div className='p-4 space-y-6'>
        {isLoading ? (
          <Loader />
        ) : order ? (
          <>
            <OrderHeader status={order.status} />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <OrderGeneral order={order} />
              <OrderSupplier supplier={order.supplier} />
            </div>

            <OrderProducts items={order.items} />

            <OrderSummary items={order.items} />

            {order.notes && <OrderNotes notes={order.notes} />}
          </>
        ) : (
          <Card>
            <CardContent className='py-10'>
              <p className='text-center text-gray-500'>
                No se encontró la orden solicitada
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutMultiRole>
  )
}

export default OrderContainer
