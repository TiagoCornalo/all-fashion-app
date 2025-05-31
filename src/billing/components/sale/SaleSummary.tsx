import { useSaleForm } from '../hooks/useSaleForm'
import { useSaleStore } from '../../../stores/saleStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Separator,
  Button,
  Loader
} from '../../../components'

const SaleSummary = () => {
  const { items, invoice, total, handleBack, remaining } = useSaleForm()

  const isSubmitting = false

  // Verificar si el pago está completo
  const paymentComplete = remaining === 0

  // Función para finalizar la venta
  const handleSubmit = () => {
    // Esta función será proporcionada por el componente padre
    // Esta implementación es un marcador de posición
    console.log('Finalizar venta desde componente hijo')
  }

  // Obtener los pagos y promociones directamente del store
  const {
    selectedMethods,
    paymentAmounts,
    promotionCode,
    itemPromotions,
    combos
  } = useSaleStore()

  // Generar los pagos basados en los métodos seleccionados y las cantidades
  const payments = selectedMethods.map((method) => ({
    type: method,
    amount: paymentAmounts[method] || 0
  }))

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      CASH: 'Efectivo',
      DEBIT: 'Débito',
      CREDIT: 'Crédito',
      TRANSFER: 'Transferencia',
      ACCOUNT_PAYABLE: 'Cuenta Corriente'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getInvoiceTypeLabel = (type: string) => {
    const labels = {
      TICKET: 'Ticket',
      FACTURA_A: 'Factura A',
      FACTURA_B: 'Factura B'
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-1 overflow-y-auto pb-4'>
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* Productos */}
                <div className='mt-4'>
                  <h3 className='font-semibold mb-2'>Productos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Subtotal</TableHead>
                        {itemPromotions.length > 0 && (
                          <TableHead>Promoción</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => {
                        const hasPromo = itemPromotions.some(
                          (p) => p.itemIndex === index
                        )
                        return (
                          <TableRow key={item.product}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.price}</TableCell>
                            <TableCell>${item.price * item.quantity}</TableCell>
                            {itemPromotions.length > 0 && (
                              <TableCell>
                                {hasPromo && (
                                  <span className='text-green-600 font-medium'>
                                    {
                                      itemPromotions.find(
                                        (p) => p.itemIndex === index
                                      )?.promotionCode
                                    }
                                  </span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Combos - Nueva sección */}
                {combos.length > 0 && (
                  <>
                    <Separator />
                    <div className='mt-4'>
                      <h3 className='font-semibold mb-2'>Combos</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Combo</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {combos.map((combo) => (
                            <TableRow key={combo.comboId}>
                              <TableCell>{combo.name}</TableCell>
                              <TableCell>{combo.quantity}</TableCell>
                              <TableCell>${combo.price}</TableCell>
                              <TableCell>
                                ${combo.price * combo.quantity}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}

                <Separator />

                {/* Promoción Global - Nueva sección */}
                {promotionCode && (
                  <div>
                    <h3 className='font-medium mb-2'>Promoción Aplicada</h3>
                    <div className='bg-green-50 border border-green-200 rounded p-2 text-green-700'>
                      Código:{' '}
                      <span className='font-medium'>{promotionCode}</span>
                    </div>
                  </div>
                )}

                {/* Pagos */}
                <div>
                  <h3 className='font-medium mb-2'>Pagos</h3>
                  <div className='space-y-2'>
                    {payments.map((payment, index) => (
                      <div key={index} className='flex justify-between'>
                        <span>{getPaymentTypeLabel(payment.type)}</span>
                        <span>${payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Facturación */}
                <div>
                  <h3 className='font-medium mb-2'>Facturación</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span>Tipo de comprobante</span>
                      <span>{getInvoiceTypeLabel(invoice.type)}</span>
                    </div>
                    {invoice.customerName && (
                      <div className='flex justify-between'>
                        <span>Cliente</span>
                        <span>{invoice.customerName}</span>
                      </div>
                    )}
                    {invoice.customer?.documentNumber && (
                      <div className='flex justify-between'>
                        <span>CUIT/DNI</span>
                        <span>{invoice.customer.documentNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className='flex justify-between text-lg font-medium'>
                  <span>Total</span>
                  <span>${total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SaleSummary
