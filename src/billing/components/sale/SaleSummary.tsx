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
  Separator
} from '../../../components'

const SaleSummary = () => {
  const { items, payments, invoice, total } = useSaleStore()

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      CASH: 'Efectivo',
      DEBIT: 'Débito',
      CREDIT: 'Crédito',
      TRANSFER: 'Transferencia'
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
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Venta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {/* Productos */}
            <div>
              <h3 className='font-medium mb-2'>Productos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.product}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>${item.price * item.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

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
                {invoice.customerDocument && (
                  <div className='flex justify-between'>
                    <span>CUIT/DNI</span>
                    <span>{invoice.customerDocument}</span>
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
  )
}

export default SaleSummary
