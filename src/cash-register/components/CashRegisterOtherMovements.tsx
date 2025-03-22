import { useState } from 'react'
import { Memo } from '../../assets'
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
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CashRegisterOtherMovements = ({
  cashRegister
}: {
  cashRegister: CashRegister
}) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const otherMovements = cashRegister.movements
    .filter((movement) => movement.type !== 'SALE')
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const totalPages = Math.ceil(otherMovements.length / itemsPerPage)

  const currentMovements = otherMovements.slice(
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

  // Función para obtener el tipo de movimiento en formato legible
  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      OPENING: 'Apertura',
      DEPOSIT: 'Depósito',
      WITHDRAWAL: 'Extracción',
      CLOSING: 'Cierre'
    }
    return labels[type] || type
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-center'>
          {/* @ts-ignore */}
          <Memo className='h-6 w-6' />
          <h1 className='text-2xl'>Otros Movimientos</h1>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {otherMovements.length === 0 ? (
          <p className='text-center text-gray-500 py-4'>
            No hay otros movimientos registrados en esta caja
          </p>
        ) : (
          <>
            <div className='overflow-x-auto rounded-md'>
              <Table className='w-full'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentMovements.map((movement, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {formatDateTime(new Date(movement.createdAt))}
                      </TableCell>
                      <TableCell>
                        {getMovementTypeLabel(movement.type)}
                      </TableCell>
                      <TableCell>{formatCurrency(movement.amount)}</TableCell>
                      <TableCell>{movement.notes || 'N/A'}</TableCell>
                      <TableCell>{movement.createdBy?.name || 'N/A'}</TableCell>
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
                  {Math.min(currentPage * itemsPerPage, otherMovements.length)}{' '}
                  de {otherMovements.length} movimientos
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

export default CashRegisterOtherMovements
