import { useQuery } from '@tanstack/react-query'
import { getSaleById } from '../services/sale'
import { useParams } from 'react-router-dom'
import { LayoutMultiRole } from '../layout'
import { Loader } from '../components'
import { Card, CardContent } from '../components/ui/card'
import {
  SaleHeader,
  SaleGeneral,
  SaleInvoice,
  SaleProducts,
  SaleCombos,
  SalePromotion,
  SalePayments,
  SaleSummary,
  SaleNotes
} from './components'

const SaleContainer = () => {
  const { id } = useParams()
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleById(id ?? '')
  })

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton
    >
      <div className='p-4 space-y-6'>
        {isLoading ? (
          <Loader />
        ) : sale ? (
          <>
            {/* <SaleHeader status={sale.status} /> */}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <SaleGeneral sale={sale} />
              <SaleInvoice invoice={sale.invoice} />
            </div>

            <SaleProducts
              items={sale.items}
              itemPromotions={sale.itemPromotions}
            />

            {sale.combosApplied && sale.combosApplied.length > 0 && (
              <SaleCombos combos={sale.combosApplied} />
            )}

            {sale.promotionApplied && (
              <SalePromotion promotion={sale.promotionApplied} />
            )}

            <SalePayments payments={sale.payments} />

            <SaleSummary
              subtotal={sale.subtotal}
              tax={sale.tax}
              total={sale.total}
              promotion={sale.promotionApplied}
            />

            {sale.notes && <SaleNotes notes={sale.notes} />}
          </>
        ) : (
          <Card>
            <CardContent className='py-10'>
              <p className='text-center text-gray-500'>
                No se encontró la venta solicitada
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </LayoutMultiRole>
  )
}

export default SaleContainer
