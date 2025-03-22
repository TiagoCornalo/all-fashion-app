import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { FileText } from 'lucide-react'
import { Separator } from '../../components/ui/separator'
import { Invoice } from '../../types/sale.types'

interface SaleInvoiceProps {
  invoice: Invoice
}

const SaleInvoice = ({ invoice }: SaleInvoiceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <FileText className='mr-2 h-5 w-5' />
          Facturación
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>Tipo de Comprobante</p>
            <p className='font-medium'>
              {invoice.type === 'X' ? 'Ticket' : `Factura ${invoice.type}`}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Punto de Venta</p>
            <p className='font-medium'>{invoice.pointOfSale}</p>
          </div>
        </div>

        {invoice.customer && (
          <>
            <Separator />
            <div className='space-y-2'>
              <h3 className='font-medium'>Datos del Cliente</h3>
              <div>
                <p className='text-sm text-gray-500'>Nombre</p>
                <p className='font-medium'>
                  {invoice.customer.name || invoice.customerName}
                </p>
              </div>
              {invoice.customer.documentType && (
                <div>
                  <p className='text-sm text-gray-500'>
                    {invoice.customer.documentType}
                  </p>
                  <p className='font-medium'>
                    {invoice.customer.documentNumber}
                  </p>
                </div>
              )}
              {invoice.customer.address && (
                <div>
                  <p className='text-sm text-gray-500'>Dirección</p>
                  <p className='font-medium'>{invoice.customer.address}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default SaleInvoice
