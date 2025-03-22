import { useQuery } from '@tanstack/react-query'
import { getSaleById } from '../services/sale'
import { useParams } from 'react-router-dom'
import { LayoutMultiRole } from '../layout'
import { Loader } from '../components'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { formatCurrency } from '../utils'

const SaleContainer = () => {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleById(id ?? '')
  })
  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}>
      <div className='p-4'>
        {isLoading ? (
          <Loader />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{data?.total}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutMultiRole>
  )
}

export default SaleContainer
