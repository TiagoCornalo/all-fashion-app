import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import {
  DataTable,
  Badge,
  Button
} from '../../../components'
import { CheckCircle, Eye, Package, User, Calendar } from 'lucide-react'
import { DataTableColumnHeader } from '../../../components/shared/DataTableColumnHeader'
import { orderVerificationService, VerifiedOrder, VerifiedOrdersFilters } from '../../../services/orderVerification.service'
import { formatDateTime } from '../../../utils'

/**
 * Componente para mostrar pedidos verificados en formato de tabla
 */
const VerifiedOrders = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<VerifiedOrdersFilters>({
    page: 1,
    pageSize: 10,
    sortBy: 'verifiedAt',
    sortOrder: 'desc',
    timezone: 'America/Argentina/Buenos_Aires'
  })

  // Query para obtener pedidos verificados
  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['verified-orders', filters],
    queryFn: () => orderVerificationService.getVerifiedOrders(filters),
    placeholderData: (previousData) => previousData
  })

  const orders = ordersResponse?.data || []
  const meta = ordersResponse?.meta

  // Definir columnas de la tabla
  const columns = useMemo<ColumnDef<VerifiedOrder>[]>(
    () => [
      {
        accessorKey: 'supplier.name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Proveedor"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{row.original.supplier?.name || 'N/A'}</span>
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Estado"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {row.original.status}
          </Badge>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'verifiedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Verificado"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {formatDateTime(row.original.verifiedAt || row.original.employeeVerification?.verificationDate)}
            </span>
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'employeeVerification.verifiedBy.name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Verificado por"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {row.original.employeeVerification?.verifiedBy?.name || 'N/A'}
            </span>
          </div>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'items',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Productos"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.items?.length || 0} artículos
          </span>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'employeeVerification.allCorrect',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Resultado"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const allCorrect = row.original.employeeVerification?.allCorrect
          const issuesCount = row.original.employeeVerification?.issues?.length || 0

          return allCorrect ? (
            <Badge variant="success">
              ✅ Todo correcto
            </Badge>
          ) : (
            <Badge variant="destructive">
              ⚠️ {issuesCount} problema{issuesCount !== 1 ? 's' : ''}
            </Badge>
          )
        },
        enableSorting: false
      },
      {
        accessorKey: 'adminApproval',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Aprobación Admin"
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const adminApproval = row.original.adminApproval

          if (!adminApproval) {
            return <span className="text-gray-500 text-sm">N/A</span>
          }

          return adminApproval.approved ? (
            <Badge variant="success">
              👑 Aprobado
            </Badge>
          ) : (
            <Badge variant="destructive">
              ❌ Rechazado
            </Badge>
          )
        },
        enableSorting: false
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/orders/${row.original._id}`)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Orden
          </Button>
        ),
        enableSorting: false
      }
    ],
    [navigate]
  )

  // Manejar cambios de paginación
  const handlePaginationChange = (page: number, pageSize: number) => {
    setFilters(prev => ({ ...prev, page, pageSize }))
  }

  // Manejar cambios de ordenamiento
  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }))
  }

  // Manejar cambios de filtros
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1
    }))
  }

  // Manejar búsqueda
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
      page: 1
    }))
  }

  // Refrescar datos
  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Pedidos Verificados
          </h2>
          {meta && meta.statistics && (
            <Badge variant="secondary">
              {meta.statistics.totalVerified} total
            </Badge>
          )}
        </div>

        {meta && meta.filterInfo && (
          <p className="text-sm text-gray-600">
            {meta.statistics?.filteredResults || 0} resultados
          </p>
        )}
      </div>

      {/* Tabla de datos */}
      <DataTable
        columns={columns}
        data={orders}
        pageCount={meta?.totalPages || 0}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        initialPage={(filters.page || 1) - 1}
        initialPageSize={filters.pageSize || 10}
        showToolbar={true}
        showSearch={true}
        showPagination={true}
        searchPlaceholder="Buscar por proveedor, producto, notas..."
        refreshButtonText="Actualizar"
        emptyMessage="No se encontraron pedidos verificados"
        loadingMessage="Cargando pedidos..."
        errorMessage="Error al cargar pedidos verificados"
        isLoading={isLoading}
        error={error ? 'Error al cargar datos' : null}
      />
    </div>
  )
}

export default VerifiedOrders