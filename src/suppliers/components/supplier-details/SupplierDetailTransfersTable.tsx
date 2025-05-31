import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DataTable,
} from '../../../components'

import DatePicker from '../../../components/shared/DatePicker'
import {
  CheckCircle,
  Phone,
  MessageCircle,
  ExternalLink,
  Eye,
  Calendar,
  Package,
  User,
  Filter,
  X
} from 'lucide-react'
import { formatDateTime } from '../../../utils'
import { toast } from 'react-toastify'
import { VerifiedTransfer, TransfersSummary } from '../../../types/inventory.types'
import { useNavigate } from 'react-router-dom'
import { getSupplierTransfers } from '../../../services/suppliers'
import { DataTableColumnHeader } from '../../../components/shared/DataTableColumnHeader'
import { ColumnDef } from '@tanstack/react-table'

interface SupplierDetailTransfersTableProps {
  supplierId: string
  transfersSummary?: TransfersSummary
}

interface TransfersResponse {
  data: VerifiedTransfer[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
}

/**
 * Componente para mostrar las transferencias verificadas de un proveedor con paginación
 * Incluye detalles de cada transferencia, productos involucrados y acciones
 */
const SupplierDetailTransfersTable = ({
  supplierId,
}: SupplierDetailTransfersTableProps) => {
  const navigate = useNavigate()
  const [selectedTransfer, setSelectedTransfer] = useState<VerifiedTransfer | null>(null)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Estados para la tabla
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'verifiedAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  // Estados para filtros de fecha
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Consultar transferencias usando React Query
  const {
    data: transfersResponse,
    isLoading,
    refetch
  } = useQuery<TransfersResponse>({
    queryKey: [
      'supplierTransfers',
      supplierId,
      pagination,
      sorting,
      filters,
      search,
      startDate,
      endDate
    ],
    queryFn: () =>
      getSupplierTransfers(supplierId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
        ...filters
      }),
    enabled: !!supplierId
  })

  const transfers = transfersResponse?.data || []
  const pageCount = transfersResponse?.meta?.totalPages || 0

  /**
   * Abre WhatsApp Web con el número especificado
   */
  const handleOpenWhatsApp = (phone: string) => {
    if (!phone) {
      toast.error('No hay número de teléfono disponible')
      return
    }

    // Limpiar el número de teléfono
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    toast.info('Abriendo WhatsApp Web...')
  }

  /**
   * Abre el modal con detalles de la transferencia
   */
  const handleViewTransfer = (transfer: VerifiedTransfer) => {
    setSelectedTransfer(transfer)
    setShowTransferModal(true)
  }

  /**
   * Navega al detalle de la venta
   */
  const handleViewSale = (saleId: string) => {
    navigate(`/sale/${saleId}`)
  }

  /**
   * Limpia todos los filtros
   */
  const handleClearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    setSearch('')
    setFilters({})
    setPagination({ page: 1, pageSize: 10 })
  }

  // Configuración de columnas para DataTable
  const columns = useMemo<ColumnDef<VerifiedTransfer>[]>(
    () => [
      {
        accessorKey: 'verifiedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Fecha'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-gray-500' />
            <div>
              <div className='font-medium'>
                {new Date(row.original.verifiedAt).toLocaleDateString('es-ES')}
              </div>
              <div className='text-xs text-gray-500'>
                {new Date(row.original.verifiedAt).toLocaleTimeString('es-ES')}
              </div>
            </div>
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'saleId',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Venta'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <Button
            variant='link'
            size='sm'
            onClick={() => handleViewSale(row.original.saleId._id)}
            className='p-0 h-auto font-mono text-blue-600 hover:text-blue-800'
          >
            {row.original.saleId._id.slice(-8)}
            <ExternalLink className='h-3 w-3 ml-1' />
          </Button>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'customerPhone',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Cliente'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Phone className='h-4 w-4 text-gray-500' />
            <span className='text-sm'>{row.original.customerPhone}</span>
            <Button
              size='sm'
              variant='outline'
              onClick={() => handleOpenWhatsApp(row.original.customerPhone)}
              className='h-6 px-2 text-xs'
            >
              <MessageCircle className='h-3 w-3' />
            </Button>
          </div>
        ),
        enableSorting: false
      },
      {
        id: 'products',
        header: 'Productos',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-gray-500' />
            <div>
              <div className='font-medium'>
                {row.original.productsInSale.length} producto{row.original.productsInSale.length !== 1 ? 's' : ''}
              </div>
              <div className='text-xs text-gray-500'>
                {row.original.productsInSale.reduce((sum, p) => sum + p.quantity, 0)} unidades
              </div>
            </div>
          </div>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'supplierPortion',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Porción Proveedor'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span className='font-medium text-green-700'>
              ${row.original.supplierPortion.toLocaleString()}
            </span>
          </div>
        ),
        enableSorting: true
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size='sm'
            variant='outline'
            onClick={() => handleViewTransfer(row.original)}
          >
            <Eye className='h-4 w-4 mr-1' />
            Ver Detalles
          </Button>
        )
      }
    ],
    [navigate]
  )

  // Manejadores de eventos para la tabla
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  // Comprobar si hay filtros activos
  const hasActiveFilters = startDate || endDate || search || Object.keys(filters).length > 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5' />
              <h3 className='text-lg font-semibold'>Transferencias Verificadas</h3>
              <Badge variant='secondary' className='ml-2'>
                {transfersResponse?.meta?.total || 0} transferencia{(transfersResponse?.meta?.total || 0) !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Botón de filtros */}
            <div className='flex items-center gap-2'>
              {hasActiveFilters && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleClearFilters}
                  className='text-red-600 hover:text-red-700'
                >
                  <X className='h-4 w-4 mr-1' />
                  Limpiar Filtros
                </Button>
              )}
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size='sm'
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className='h-4 w-4 mr-1' />
                Filtros
              </Button>
            </div>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg border'>
              <h4 className='text-sm font-medium mb-3'>Filtrar por fecha</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm text-gray-600 mb-1 block'>Fecha desde:</label>
                  <DatePicker
                    date={startDate}
                    onChange={setStartDate}
                    placeholder='Seleccionar fecha inicio'
                    className='w-full'
                  />
                </div>
                <div>
                  <label className='text-sm text-gray-600 mb-1 block'>Fecha hasta:</label>
                  <DatePicker
                    date={endDate}
                    onChange={setEndDate}
                    placeholder='Seleccionar fecha fin'
                    className='w-full'
                  />
                </div>
              </div>

              {/* Indicadores de filtros activos */}
              {hasActiveFilters && (
                <div className='mt-3 flex flex-wrap gap-2'>
                  {startDate && (
                    <Badge variant='secondary' className='text-xs'>
                      Desde: {startDate.toLocaleDateString('es-ES')}
                    </Badge>
                  )}
                  {endDate && (
                    <Badge variant='secondary' className='text-xs'>
                      Hasta: {endDate.toLocaleDateString('es-ES')}
                    </Badge>
                  )}
                  {search && (
                    <Badge variant='secondary' className='text-xs'>
                      Búsqueda: "{search}"
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* DataTable con paginación */}
          <DataTable
            columns={columns}
            data={transfers}
            pageCount={pageCount}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            initialPage={pagination.page - 1}
            initialPageSize={pagination.pageSize}
            isLoading={isLoading}
            emptyMessage='No hay transferencias verificadas para este proveedor'
            searchPlaceholder='Buscar por ID de venta, teléfono...'
          />
        </CardContent>
      </Card>

      {/* Modal de detalles de transferencia */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              Detalles de Transferencia Verificada
            </DialogTitle>
          </DialogHeader>

          {selectedTransfer && (
            <div className='space-y-6'>
              {/* Información general */}
              <div className='grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg'>
                <div>
                  <span className='text-sm font-medium text-gray-600'>Fecha de verificación:</span>
                  <div className='font-medium'>
                    {formatDateTime(new Date(selectedTransfer.verifiedAt || ''))}
                  </div>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-600'>ID de venta:</span>
                  <div className='font-mono text-sm'>{selectedTransfer.saleId?._id}</div>
                </div>
                <div>
                  <span className='text-sm font-medium text-gray-600'>Porción del proveedor:</span>
                  <div className='font-medium text-green-700'>
                    ${selectedTransfer.supplierPortion?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className='p-4 bg-blue-50 rounded-lg'>
                <h4 className='font-medium text-blue-800 mb-2 flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  Cliente
                </h4>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4 text-blue-600' />
                    <span>{selectedTransfer.customerPhone || ''}</span>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => handleOpenWhatsApp(selectedTransfer.customerPhone || '')}
                    className='bg-green-600 hover:bg-green-700'
                  >
                    <MessageCircle className='h-4 w-4 mr-1' />
                    Contactar
                  </Button>
                </div>
              </div>

              {/* Productos involucrados */}
              <div>
                <h4 className='font-medium mb-3 flex items-center gap-2'>
                  <Package className='h-4 w-4' />
                  Productos en esta transferencia
                </h4>
                <div className='space-y-2'>
                  {selectedTransfer.productsInSale.map((product) => (
                    <div key={product._id} className='flex justify-between items-center p-3 bg-gray-50 rounded'>
                      <div>
                        <div className='font-medium'>{product.productName}</div>
                        <div className='text-sm text-gray-600'>
                          Cantidad: {product.quantity} × ${product.unitPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium'>${product.subtotal.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas de verificación */}
              {selectedTransfer.verificationNotes && (
                <div className='p-4 bg-yellow-50 rounded-lg'>
                  <h4 className='font-medium text-yellow-800 mb-2'>Notas de verificación:</h4>
                  <p className='text-sm text-yellow-700'>{selectedTransfer.verificationNotes}</p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => handleViewSale(selectedTransfer.saleId._id)}
                >
                  <ExternalLink className='h-4 w-4 mr-1' />
                  Ver Venta Completa
                </Button>
                <Button onClick={() => setShowTransferModal(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SupplierDetailTransfersTable