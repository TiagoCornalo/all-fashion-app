import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useSaleForm } from '../hooks/useSaleForm'
import { useSaleStore } from '../../../stores/saleStore'
import { useSaleTotals } from '../hooks/useSaleTotals'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../../components'
import { Sale } from '../../../types/sale.types'

const FinalizeSaleStep = () => {
  const [saleResult, setSaleResult] = useState<Sale | null>(null)
  const {
    items,
    total,
    payments,
    invoice,
    notes,
    clearSale
  } = useSaleStore()
  const { isSubmitting, setIsSubmitting, handleCancel } = useSaleForm()
  const queryClient = useQueryClient()

  const { totalSurcharge, totalToCharge, paymentsForBackend } = useSaleTotals()

  const createSaleMutation = useMutation({
    mutationFn: async () => {
      const cashRegister = JSON.parse(localStorage.getItem('activeCashRegister') || '{}')
      if (!cashRegister?._id) {
        throw new Error('No hay una caja registradora activa')
      }
      // Sincronizamos los payments del hook (con bank+surcharge calculado en vivo)
      // antes de crear, así createSale no depende de que handleInvoiceSubmit haya corrido.
      useSaleStore.getState().setPayments(paymentsForBackend)
      return useSaleStore.getState().createSale(cashRegister._id)
    },
    onSuccess: (result) => {
      setSaleResult(result)
      setIsSubmitting(false)
      toast.success('¡Venta creada exitosamente!')
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error & { status?: number; label?: string }) => {
      setIsSubmitting(false)
      const label = error.label || 'Error al crear la venta'
      const message = error.message || 'Error desconocido'
      toast.error(`${label}: ${message}`, { autoClose: 8000 })
    }
  })

  const handleFinalizeSale = () => {
    setIsSubmitting(true)
    createSaleMutation.mutate()
  }

  const handleNewSale = () => {
    clearSale()
    setSaleResult(null)
    window.location.href = '/billing'
  }

  const handleViewSale = () => {
    if (saleResult?._id) {
      window.open(`/sales/${saleResult._id}`, '_blank')
    }
  }

  if (saleResult) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-6 w-6" />
              ¡Venta Finalizada Exitosamente!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID de Venta:</span> {saleResult._id}
              </div>
              <div>
                <span className="font-medium">Total cobrado:</span>{' '}
                ${(saleResult.total ?? totalToCharge).toFixed(2)}
              </div>
              {saleResult.subtotal !== undefined &&
                saleResult.total !== undefined &&
                saleResult.total > saleResult.subtotal && (
                  <div className='col-span-2 text-xs text-muted-foreground'>
                    Subtotal ${saleResult.subtotal.toFixed(2)} + recargos $
                    {(saleResult.total - saleResult.subtotal).toFixed(2)}
                  </div>
                )}
              {saleResult.invoice?.number && (
                <div>
                  <span className="font-medium">Factura:</span> {saleResult.invoice.type} {saleResult.invoice.number}
                </div>
              )}
              <div>
                <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={handleNewSale} className="flex-1">
                Nueva Venta
              </Button>
              <Button onClick={handleViewSale} variant="outline" className="flex-1">
                Ver Detalle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen Final</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Productos:</span> {items.length}
            </div>
            <div>
              <span className="font-medium">Subtotal:</span> ${total.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Tipo de Factura:</span> {invoice.type}
            </div>
            <div>
              <span className="font-medium">Métodos de Pago:</span> {payments.length}
            </div>
            {totalSurcharge > 0 && (
              <div className='col-span-2 text-amber-700'>
                <span className='font-medium'>Recargo por tarjeta:</span> +${totalSurcharge.toFixed(2)}
              </div>
            )}
            <div className='col-span-2 border-t pt-2 text-base font-semibold'>
              Total a cobrar al cliente: ${totalToCharge.toFixed(2)}
            </div>
          </div>

          {notes && (
            <div>
              <span className="font-medium">Notas:</span>
              <p className="text-sm text-gray-600 mt-1">{notes}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-medium">Pagos:</h4>
            {paymentsForBackend.map((payment, index) => (
              <div key={index} className='space-y-0.5'>
                <div className='flex justify-between text-sm'>
                  <span>{payment.method}</span>
                  <span>${payment.amount.toFixed(2)}</span>
                </div>
                {payment.surcharge?.applied && payment.surcharge.amount > 0 && (
                  <div className='pl-3 text-xs text-amber-700'>
                    ↳ ${payment.surcharge.baseAmount.toFixed(2)} base + ${payment.surcharge.amount.toFixed(2)} ({payment.surcharge.percentage}%)
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleFinalizeSale}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Finalizar Venta
        </Button>
      </div>
    </div>
  )
}

export default FinalizeSaleStep