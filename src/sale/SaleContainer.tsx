import { useQuery } from '@tanstack/react-query'
import { getSaleById } from '../services/sale'
import { useParams } from 'react-router-dom'
import { LayoutMultiRole } from '../layout'
import { Loader } from '../components'
import { Card, CardContent } from '../components/ui/card'
import {
  SaleGeneral,
  SaleInvoice,
  SaleProducts,
  SaleCombos,
  SalePromotion,
  SalePayments,
  SaleSummary,
  SaleNotes,
  SaleTransferVerification,
  SaleAccountsPayable
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
              itemPromotions={sale.itemPromotions || []}
            />

            {sale.combosApplied && sale.combosApplied.length > 0 && (
              <SaleCombos combos={sale.combosApplied.map(combo => ({
                _id: combo.comboId,
                comboId: combo.comboId,
                name: combo.name,
                code: combo.code,
                quantity: combo.quantity,
                originalPrice: combo.originalPrice,
                totalPrice: combo.totalPrice
              }))} />
            )}

            {sale.promotionApplied && (
              <SalePromotion promotion={sale.promotionApplied} />
            )}

            <SalePayments payments={sale.payments.map(payment => ({
              _id: payment._id || '',
              method: payment.method,
              amount: payment.amount
            }))} />

            <SaleTransferVerification
              saleId={sale._id}
              payments={sale.payments}
              items={sale.items.map(item => {
                // Verificar si item.product es un objeto con las propiedades necesarias
                const productData = typeof item.product === 'object' && item.product !== null
                  ? item.product as { _id: string; name: string; supplier: string }
                  : null;

                return {
                  product: {
                    _id: productData?._id || (typeof item.product === 'string' ? item.product : ''),
                    name: productData?.name || item.name || '',
                    supplier: productData?.supplier || ''
                  },
                  quantity: item.quantity
                };
              })}
            />

            {/* Componente para cargar a cuenta corriente */}
            <SaleAccountsPayable
              saleId={sale._id}
              saleTotal={sale.total}
              saleItems={sale.items.map(item => {
                const productData = typeof item.product === 'object' && item.product !== null
                  ? item.product as { _id: string; name: string }
                  : null;

                return {
                  product: {
                    _id: productData?._id || (typeof item.product === 'string' ? item.product : ''),
                    name: productData?.name || item.name || ''
                  },
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.subtotal
                };
              })}
              invoice={sale.invoice}
            />

            <SaleSummary
              subtotal={sale.subtotal || 0}
              tax={sale.tax || 0}
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
