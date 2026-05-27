import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSaleById, cancelSale } from '../services/sale'
import { useParams } from 'react-router-dom'
import { LayoutMultiRole } from '../layout'
import { Loader, Button } from '../components'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../components/ui/alert-dialog'
import { Card, CardContent } from '../components/ui/card'
import { Ban, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-toastify'
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
  SaleAccountsPayable,
  SaleToQuote
} from './components'

const SaleContainer = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleById(id ?? '')
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelSale(id!),
    onSuccess: () => {
      toast.success('Venta cancelada. Se restauró stock y se ajustó la caja.')
      queryClient.invalidateQueries({ queryKey: ['sale', id] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      setCancelDialogOpen(false)
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.message ||
        'Error al cancelar la venta'
      toast.error(message, { autoClose: 8000 })
    }
  })

  // Permisos / estado para acciones
  const cashRegisterStatus = (sale as any)?.cashRegister?.status
  const isCancelled = sale?.status === 'CANCELLED'
  const isCashClosed = cashRegisterStatus === 'CLOSED'
  const canCancel = !!sale && !isCancelled && !isCashClosed

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton
    >
      <div className='p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6'>
        {isLoading ? (
          <Loader />
        ) : sale ? (
          <>
            {/* Header con estado + acciones */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
              <div className='flex items-center gap-2'>
                {isCancelled ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700'>
                    <Ban className='h-3.5 w-3.5' />
                    Venta cancelada
                  </span>
                ) : isCashClosed ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700'>
                    Solo lectura (caja cerrada)
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700'>
                    <CheckCircle2 className='h-3.5 w-3.5' />
                    Activa
                  </span>
                )}
              </div>
              <div className='flex gap-2'>
                {canCancel && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCancelDialogOpen(true)}
                    className='text-red-700 hover:bg-red-50 border-red-200'
                  >
                    <Ban className='mr-1 h-3.5 w-3.5' />
                    Cancelar venta
                  </Button>
                )}
              </div>
            </div>

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar esta venta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se va a restaurar el stock de cada producto y revertir los
                    pagos en la caja. Si hay pagos en cuenta corriente, se emite
                    una nota de crédito automática. Esta acción no se puede
                    deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelMut.isPending}>
                    Volver
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMut.mutate()}
                    disabled={cancelMut.isPending}
                    className='bg-red-600 hover:bg-red-700'
                  >
                    {cancelMut.isPending ? 'Cancelando...' : 'Sí, cancelar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
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

            {/* Componente para generar remitos/presupuestos */}
            <SaleToQuote
              saleId={sale._id}
              saleTotal={sale.total}
              saleItems={sale.items.map(item => {
                const productData = typeof item.product === 'object' && item.product !== null
                  ? item.product as { _id: string; name: string; code?: string }
                  : null;

                return {
                  product: {
                    _id: productData?._id || (typeof item.product === 'string' ? item.product : ''),
                    name: productData?.name || item.name || '',
                    code: productData?.code
                  },
                  quantity: item.quantity,
                  price: item.price,
                  subtotal: item.subtotal
                };
              })}
              customer={{
                name: sale.invoice?.customer?.name || sale.invoice?.customerName,
                phone: sale.invoice?.customer?.phone,
                email: sale.invoice?.customer?.email
              }}
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
            <CardContent className='py-8 sm:py-10'>
              <p className='text-center text-gray-500 text-sm sm:text-base'>
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
