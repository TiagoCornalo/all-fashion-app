import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  DataTablePagination,
  Input,
  Button,
  Card,
  CardContent,
} from '../../components'
import { getPromotionUsageHistory } from '../../services/discounts'
import { Discount, PromotionUsage } from '../../types/discount.types'
import { formatDateTime, formatCurrency } from '../../utils'
import { History, Calendar, User, DollarSign, FileText } from 'lucide-react'

interface PromotionUsageHistoryModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  discount: Discount | null
}

const PromotionUsageHistoryModal = ({
  isOpen,
  onOpenChange,
  discount
}: PromotionUsageHistoryModalProps) => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' })

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['promotion-usage-history', discount?._id, pagination, dateFilter],
    queryFn: () => {
      if (!discount?._id) return null
      return getPromotionUsageHistory(discount._id, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    },
    enabled: isOpen && !!discount?._id
  })

  const handlePaginationChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  if (!discount) return null

  const usageHistory = historyData?.data || []
  const meta = historyData?.meta

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Usos - {discount.code}
          </DialogTitle>
          <DialogDescription>
            {discount.description} ({discount.discountPercentage}% descuento)
          </DialogDescription>
        </DialogHeader>

        {/* Estadísticas rápidas */}
        {meta && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Usos</p>
                    <p className="text-lg font-semibold">{meta.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Descuento Total</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(
                        usageHistory.reduce((sum, usage) => sum + usage.discountInfo.discountAmount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Clientes Únicos</p>
                    <p className="text-lg font-semibold">
                      {new Set(usageHistory.map(usage => usage.customer.documentNumber)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Último Uso</p>
                    <p className="text-sm font-semibold">
                      {usageHistory.length > 0
                        ? formatDateTime(new Date(usageHistory[0].createdAt))
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros de fecha */}
        <div className="flex gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <Input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <Input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearDateFilter}
              disabled={!dateFilter.startDate && !dateFilter.endDate}
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Tabla de historial */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-gray-500">Cargando historial...</p>
              </div>
            </div>
          ) : usageHistory.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <p className="text-gray-500">No hay usos registrados</p>
                <p className="text-sm text-gray-400 mt-1">
                  {dateFilter.startDate || dateFilter.endDate
                    ? 'Intenta cambiar los filtros de fecha'
                    : 'Esta promoción aún no ha sido utilizada'
                  }
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo Aplicación</TableHead>
                  <TableHead>Monto Original</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Monto Final</TableHead>
                  <TableHead>Venta</TableHead>
                  <TableHead>Aplicado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageHistory.map((usage: PromotionUsage) => (
                  <TableRow key={usage._id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(new Date(usage.createdAt))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{usage.customer.name}</div>
                        {usage.customer.phone && (
                          <div className="text-xs text-gray-500">{usage.customer.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {usage.customer.documentType}: {usage.customer.documentNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usage.discountInfo.applicationType === 'GLOBAL' ? 'default' : 'secondary'}>
                        {usage.discountInfo.applicationType === 'GLOBAL' ? 'Global' : 'Por Item'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(usage.discountInfo.originalAmount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-green-600 font-medium">
                        -{formatCurrency(usage.discountInfo.discountAmount)}
                        <div className="text-xs text-gray-500">
                          ({usage.discountInfo.discountPercentage}%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(usage.discountInfo.finalAmount)}
                    </TableCell>
                    <TableCell>
                      {usage.saleId ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {usage.saleId.invoice.type} {usage.saleId.invoice.number || 'S/N'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateTime(new Date(usage.saleId.createdAt))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {usage.appliedBy?.name || 'Sistema'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div className="border-t pt-4">
            <DataTablePagination
              currentPage={pagination.page}
              totalPages={meta.totalPages}
              onPageChange={handlePaginationChange}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PromotionUsageHistoryModal