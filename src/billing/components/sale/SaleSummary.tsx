import { useSaleForm } from '../hooks/useSaleForm'
import { useSaleStore } from '../../../stores/saleStore'
import { useSaleTotals } from '../hooks/useSaleTotals'
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

const formatArs = (value?: number | null) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const USD_RATE_LABELS: Record<string, string> = {
  blue: 'dólar blue',
  oficial: 'dólar oficial',
  mep: 'dólar MEP',
  tarjeta: 'dólar tarjeta'
}

const getPricingLabel = (item: { priceUSD?: number | null; usdRateType?: string | null }) => {
  if (!item.priceUSD || item.priceUSD <= 0) return null
  return `Final con ${USD_RATE_LABELS[item.usdRateType || 'blue'] || 'dólar'}`
}

const SaleSummary = () => {
  const { items, invoice, total } = useSaleForm()

  const { promotionCode, itemPromotions, combos } = useSaleStore()

  // Fuente única de verdad: cálculo en vivo desde el estado de la venta.
  // No depende de que handleInvoiceSubmit haya corrido.
  const { totalSurcharge, totalToCharge, paymentsForBackend } = useSaleTotals()

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
                            <TableCell>
                              <div>{formatArs(item.price)}</div>
                              {getPricingLabel(item) && (
                                <div className='text-[11px] text-muted-foreground'>
                                  {getPricingLabel(item)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{formatArs(item.price * item.quantity)}</TableCell>
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
                    {paymentsForBackend.map((payment, index) => (
                      <div key={index} className='space-y-0.5'>
                        <div className='flex justify-between'>
                          <span>{getPaymentTypeLabel(payment.method)}</span>
                          <span>${payment.amount.toFixed(2)}</span>
                        </div>
                        {payment.surcharge?.applied && payment.surcharge.amount > 0 && (
                          <div className='flex justify-between text-xs text-amber-700 pl-3'>
                            <span>
                              ↳ incluye {payment.surcharge.percentage}% de recargo (${payment.surcharge.baseAmount.toFixed(2)} base + ${payment.surcharge.amount.toFixed(2)} recargo)
                            </span>
                          </div>
                        )}
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

                {/* Desglose final */}
                <div className='space-y-1'>
                  <div className='flex justify-between text-sm'>
                    <span>Subtotal</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  {totalSurcharge > 0 && (
                    <div className='flex justify-between text-sm text-amber-700'>
                      <span>Recargo por tarjeta</span>
                      <span>+${totalSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-lg font-bold border-t pt-1 mt-1'>
                    <span>Total a cobrar al cliente</span>
                    <span>${totalToCharge.toFixed(2)}</span>
                  </div>
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
