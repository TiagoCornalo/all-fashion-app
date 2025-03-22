import { useState } from 'react'
import { ShoppingCart } from '../../assets'
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
  Button
} from '../../components'
import { CashRegister } from '../../stores/cashRegisterStore'
import { formatCurrency, formatDateTime } from '../../utils'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useIsMobile } from '../../hooks'
import { Link } from 'react-router-dom'

const CashRegisterSales = ({
  cashRegister
}: {
  cashRegister: CashRegister
}) => {
  const isMobile = useIsMobile?.() || false
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const salesMovements = cashRegister.movements
    .filter((movement) => movement.type === 'SALE')
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const totalPages = Math.ceil(salesMovements.length / itemsPerPage)

  const currentSales = salesMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const getInvoiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      A: 'Factura A',
      B: 'Factura B',
      C: 'Factura C',
      X: 'Ticket X'
    }
    return labels[type] || type
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT: 'Crédito',
      DEBIT: 'Débito',
      TRANSFER: 'Transferencia'
    }
    return labels[method] || method
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-center'>
          {/* @ts-ignore */}
          <ShoppingCart className='h-6 w-6' />
          <h1 className='text-2xl'>Ventas Realizadas</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {salesMovements.length === 0 ? (
          <p className='text-center text-gray-500 py-4'>
            No hay ventas registradas en esta caja
          </p>
        ) : (
          <>
            <div className='overflow-x-auto rounded-md'>
              <Table className='w-full'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    {!isMobile && <TableHead>Número</TableHead>}
                    <TableHead>Métodos de Pago</TableHead>
                    <TableHead>Monto</TableHead>
                    {!isMobile && <TableHead>Notas</TableHead>}
                    {!isMobile && <TableHead>Creado por</TableHead>}
                    <TableHead className='text-right'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentSales.map((sale, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDateTime(new Date(sale.createdAt)).split(' ')[1]}
                      </TableCell>
                      <TableCell>
                        {sale.saleDetails?.invoiceType
                          ? getInvoiceTypeLabel(sale.saleDetails.invoiceType)
                          : 'N/A'}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {sale.saleDetails?.invoiceNumber || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell>
                        {sale.saleDetails?.paymentMethods
                          ?.map((method) => getPaymentMethodLabel(method))
                          .join(', ') || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(sale.amount)}</TableCell>
                      {!isMobile && (
                        <TableCell>{sale.notes || 'N/A'}</TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>{sale.createdBy.name || 'N/A'}</TableCell>
                      )}
                      <TableCell className='text-right'>
                        <Link to={`/sale/${sale.reference}`}>
                          <Button variant='outline' size='sm'>
                            <Eye className='h-4 w-4' />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between mt-4 px-4 pb-4'>
                <div className='text-sm text-gray-500'>
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, salesMovements.length)}{' '}
                  de {salesMovements.length} ventas
                </div>
                <div className='flex space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CashRegisterSales
