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
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5 mx-auto sm:mx-0" />
            <span className="text-center sm:text-left break-words">
              Historial de Usos - {discount.code}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-center sm:text-left break-words">
            {discount.description} ({discount.discountPercentage}% descuento)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-3 sm:space-y-4">
          {/* Estadísticas rápidas */}
          {meta && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <Card>
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mx-auto sm:mx-0" />
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600">Total de Usos</p>
                      <p className="text-sm sm:text-lg font-semibold">{meta.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mx-auto sm:mx-0" />
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600">Descuento Total</p>
                      <p className="text-sm sm:text-lg font-semibold break-all">
                        {formatCurrency(
                          usageHistory.reduce((sum, usage) => sum + usage.discountInfo.discountAmount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mx-auto sm:mx-0" />
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600">Clientes Únicos</p>
                      <p className="text-sm sm:text-lg font-semibold">
                        {new Set(usageHistory.map(usage => usage.customer.documentNumber)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 mx-auto sm:mx-0" />
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-gray-600">Último Uso</p>
                      <p className="text-xs sm:text-sm font-semibold break-words">
                        {usageHistory.length > 0 ? (
                          <span className="hidden sm:inline">
                            {formatDateTime(new Date(usageHistory[0].createdAt))}
                          </span>
                        ) : (
                          'N/A'
                        )}
                        {usageHistory.length > 0 && (
                          <span className="sm:hidden">
                            {new Date(usageHistory[0].createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros de fecha */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <Input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <Input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearDateFilter}
                disabled={!dateFilter.startDate && !dateFilter.endDate}
                size="sm"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Limpiar
              </Button>
            </div>
          </div>

          {/* Tabla de historial */}
          <div className="overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 sm:h-48">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500">Cargando historial...</p>
                </div>
              </div>
            ) : usageHistory.length === 0 ? (
              <div className="flex items-center justify-center h-32 sm:h-48">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-500">No hay usos registrados</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {dateFilter.startDate || dateFilter.endDate
                      ? 'Intenta cambiar los filtros de fecha'
                      : 'Esta promoción aún no ha sido utilizada'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Fecha</TableHead>
                      <TableHead className="text-xs">Cliente</TableHead>
                      <TableHead className="text-xs">Documento</TableHead>
                      <TableHead className="text-xs">Tipo Aplicación</TableHead>
                      <TableHead className="text-xs">Monto Original</TableHead>
                      <TableHead className="text-xs">Descuento</TableHead>
                      <TableHead className="text-xs">Monto Final</TableHead>
                      <TableHead className="text-xs">Venta</TableHead>
                      <TableHead className="text-xs">Aplicado Por</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageHistory.map((usage: PromotionUsage) => (
                      <TableRow key={usage._id}>
                        <TableCell>
                          <div className="text-xs">
                            {formatDateTime(new Date(usage.createdAt))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-xs break-words">{usage.customer.name}</div>
                            {usage.customer.phone && (
                              <div className="text-xs text-gray-500 break-all">{usage.customer.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs break-all">
                            {usage.customer.documentType}: {usage.customer.documentNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usage.discountInfo.applicationType === 'GLOBAL' ? 'default' : 'secondary'} className="text-xs">
                            {usage.discountInfo.applicationType === 'GLOBAL' ? 'Global' : 'Por Item'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs break-all">
                            {formatCurrency(usage.discountInfo.originalAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-green-600 font-medium">
                            <div className="text-xs break-all">
                              -{formatCurrency(usage.discountInfo.discountAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({usage.discountInfo.discountPercentage}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs break-all">
                            {formatCurrency(usage.discountInfo.finalAmount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {usage.saleId ? (
                            <div className="text-xs">
                              <div className="font-medium break-words">
                                {usage.saleId.invoice.type} {usage.saleId.invoice.number || 'S/N'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDateTime(new Date(usage.saleId.createdAt))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs break-words">
                            {usage.appliedBy?.name || 'Sistema'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Vista móvil - Cards */}
            <div className="sm:hidden space-y-3">
              {usageHistory.map((usage: PromotionUsage) => (
                <Card key={usage._id}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs break-words">{usage.customer.name}</p>
                        <p className="text-xs text-gray-500 break-all">
                          {usage.customer.documentType}: {usage.customer.documentNumber}
                        </p>
                      </div>
                      <Badge variant={usage.discountInfo.applicationType === 'GLOBAL' ? 'default' : 'secondary'} className="text-xs ml-2">
                        {usage.discountInfo.applicationType === 'GLOBAL' ? 'Global' : 'Item'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Original:</span>
                        <p className="font-medium break-all">{formatCurrency(usage.discountInfo.originalAmount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Descuento:</span>
                        <p className="font-medium text-green-600 break-all">
                          -{formatCurrency(usage.discountInfo.discountAmount)} ({usage.discountInfo.discountPercentage}%)
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Final:</span>
                        <p className="font-medium break-all">{formatCurrency(usage.discountInfo.finalAmount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fecha:</span>
                        <p className="break-words">{new Date(usage.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {usage.saleId && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">Venta:</p>
                        <p className="text-xs font-medium break-words">
                          {usage.saleId.invoice.type} {usage.saleId.invoice.number || 'S/N'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Paginación */}
        {meta && meta.totalPages > 1 && (
          <div className="border-t pt-2 sm:pt-4 flex-shrink-0">
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