import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../../../components'
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components'
import {
  Eye,
  Edit,
  Plus,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react'
import {
  accountsPayableService,
  AccountPayable,
  AccountsPayableFilters,
  AccountsPayableResponse
} from '../../../services/accountsPayable.service'
import { formatCurrency, formatDateTime } from '../../../utils'
import { useAuth } from '../../../context/auth/useAuth'
import { CreateAccountForm } from '../forms/CreateAccountForm'
import { AccountFilters } from './'

interface AccountsTableProps {
  defaultFilters?: Partial<AccountsPayableFilters>
}

// Interfaz para validar datos de backend
interface RawAccountData {
  _id?: string
  customer?: {
    name?: string
    documentType?: string
    documentNumber?: string
  }
  currentBalance?: number | string
  overdueAmount?: number | string
  creditLimit?: number | string
  paymentTerms?: {
    days?: number | string
    interestRate?: number | string
  }
  status?: string
  createdAt?: string
  [key: string]: unknown
}

/**
 * Tabla principal de cuentas corrientes con filtros y acciones
 */
export const AccountsTable = ({ defaultFilters = {} }: AccountsTableProps) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<AccountsPayableFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...defaultFilters
  })
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Convertir role a string para comparaciones con validación
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'

  // Query para obtener cuentas con validaciones defensivas
  const {
    data: accountsData,
    isLoading,
    error,
    refetch
  } = useQuery<AccountsPayableResponse, Error>({
    queryKey: ['accounts-payable', filters],
    queryFn: async () => {
      try {
        const result = await accountsPayableService.getAccounts(filters)

        // Validar estructura de respuesta
        if (!result || typeof result !== 'object') {
          throw new Error('Respuesta inválida del servidor')
        }

        // Asegurar que data sea un array
        if (!Array.isArray(result.data)) {
          console.warn('Data is not an array, using empty array')
          result.data = []
        }

        // Validar y limpiar cada cuenta
        result.data = result.data.filter((account: RawAccountData) => {
          return account &&
            typeof account === 'object' &&
            account._id &&
            account.customer &&
            account.customer.name
        }).map((account: RawAccountData) => ({
          ...account,
          currentBalance: Number(account.currentBalance) || 0,
          overdueAmount: Number(account.overdueAmount) || 0,
          creditLimit: Number(account.creditLimit) || 0,
          customer: {
            ...account.customer,
            name: account.customer?.name || 'Sin nombre',
            documentType: account.customer?.documentType || 'DNI',
            documentNumber: account.customer?.documentNumber || 'Sin documento'
          },
          paymentTerms: {
            days: Number(account.paymentTerms?.days) || 30,
            interestRate: Number(account.paymentTerms?.interestRate) || 0
          },
          status: account.status || 'ACTIVE',
          createdAt: account.createdAt || new Date().toISOString()
        })) as AccountPayable[]

        // Validar meta información
        if (!result.meta || typeof result.meta !== 'object') {
          result.meta = {
            total: result.data.length,
            page: 1,
            pageSize: 20,
            totalPages: 1,
            appliedFilters: {},
            summary: {
              totalBalance: 0,
              totalOverdue: 0,
              avgBalance: 0,
              accountsWithDebt: 0,
              accountsOverdue: 0
            },
            availableStatuses: ['ACTIVE', 'OVERDUE', 'SUSPENDED', 'CLOSED'],
            availableDocumentTypes: ['DNI', 'CUIT']
          }
        }

        return result
      } catch (error) {
        console.error('Error fetching accounts:', error)
        throw error
      }
    },
    placeholderData: (previousData) => previousData,
    retry: 2,
    retryDelay: 1000
  })

  // Mutation para actualizar estado de cuenta
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string } }) =>
      accountsPayableService.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })
    },
    onError: (error) => {
      console.error('Error updating account:', error)
    }
  })

  // Manejadores de eventos con validaciones
  const handleViewAccount = useCallback((account: AccountPayable) => {
    if (!account?._id) {
      console.error('Invalid account ID')
      return
    }
    navigate(`/accounts-payable/${account._id}`)
  }, [navigate])

  const handleEditAccount = useCallback((account: AccountPayable) => {
    if (!account?._id) {
      console.error('Invalid account ID')
      return
    }
    navigate(`/accounts-payable/${account._id}/edit`)
  }, [navigate])

  const handleStatusChange = useCallback((account: AccountPayable, newStatus: string) => {
    if (!account?._id || !newStatus) {
      console.error('Invalid account or status')
      return
    }
    updateAccountMutation.mutate({
      id: account._id,
      data: { status: newStatus }
    })
  }, [updateAccountMutation])

  const handleFiltersChange = useCallback((newFilters: Partial<AccountsPayableFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  // Handlers para DataTable compatibles con la interfaz esperada
  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    if (page > 0 && pageSize > 0) {
      setFilters(prev => ({ ...prev, page, pageSize }))
    }
  }, [])

  const handleSortingChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    if (sortBy && sortOrder) {
      setFilters(prev => ({ ...prev, sortBy, sortOrder }))
    }
  }, [])

  const handleFilterChange = useCallback((filterObj: Record<string, string>) => {
    // Convertir filtros del DataTable al formato esperado
    const newFilters: Partial<AccountsPayableFilters> = {}

    Object.entries(filterObj).forEach(([key, value]) => {
      if (value) {
        (newFilters as Record<string, string>)[key] = value
      }
    })

    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined, page: 1 }))
  }, [])

  const handleRefresh = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Función para obtener badge de estado con validaciones
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { icon: CheckCircle, color: 'text-green-600 bg-green-50 hover:bg-green-100' },
      OVERDUE: { icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
      SUSPENDED: { icon: Pause, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
      CLOSED: { icon: XCircle, color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    const Icon = config.icon

    const statusLabels = {
      ACTIVE: 'Activa',
      OVERDUE: 'Vencida',
      SUSPENDED: 'Suspendida',
      CLOSED: 'Cerrada'
    }

    return (
      <Badge className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    )
  }

  // Definición de columnas con validaciones
  const columns: ColumnDef<AccountPayable, unknown>[] = useMemo(() => [
    {
      accessorKey: 'customer.name',
      header: 'Cliente',
      cell: ({ row }) => {
        const account = row.original
        if (!account?.customer) return <span className="text-gray-400">Sin datos</span>

        return (
          <div>
            <p className="font-medium">{account.customer.name || 'Sin nombre'}</p>
            <p className="text-sm text-gray-500">
              {account.customer.documentType || 'DNI'}: {account.customer.documentNumber || 'Sin documento'}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'currentBalance',
      header: 'Saldo Actual',
      cell: ({ row }) => {
        const balance = Number(row.getValue('currentBalance')) || 0
        return (
          <div className="text-right">
            <p className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'overdueAmount',
      header: 'Vencido',
      cell: ({ row }) => {
        const overdue = Number(row.getValue('overdueAmount')) || 0
        return (
          <div className="text-right">
            <p className={`font-semibold ${overdue > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {formatCurrency(overdue)}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'creditLimit',
      header: 'Límite de Crédito',
      cell: ({ row }) => {
        const limit = Number(row.getValue('creditLimit')) || 0
        const balance = Number(row.original?.currentBalance) || 0
        const utilization = limit > 0 ? (balance / limit) * 100 : 0

        return (
          <div className="text-right">
            <p className="font-medium">{formatCurrency(limit)}</p>
            <p className={`text-xs ${utilization > 80 ? 'text-red-500' :
              utilization > 60 ? 'text-yellow-500' : 'text-green-500'
              }`}>
              {limit > 0 ? `${utilization.toFixed(1)}% usado` : 'Sin límite'}
            </p>
          </div>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string || 'ACTIVE'
        return getStatusBadge(status)
      }
    },
    {
      accessorKey: 'paymentTerms',
      header: 'Condiciones',
      cell: ({ row }) => {
        const terms = row.original?.paymentTerms
        if (!terms) return <span className="text-gray-400">Sin datos</span>

        const days = Number(terms.days) || 30
        const interestRate = Number(terms.interestRate) || 0

        return (
          <div className="text-sm">
            <p>{days} días</p>
            <p className="text-gray-500">{(interestRate * 100).toFixed(2)}% interés</p>
          </div>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Creada',
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        if (!date) return <span className="text-gray-400">Sin fecha</span>

        return (
          <div className="text-sm text-gray-600">
            {formatDateTime(date)}
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const account = row.original
        if (!account) return null

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewAccount(account)}
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditAccount(account)}
                title="Editar cuenta"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {isAdmin && account.status === 'ACTIVE' && (account.overdueAmount || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(account, 'OVERDUE')}
                className="text-orange-600 hover:text-orange-700"
                title="Marcar como vencida"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      }
    }
  ], [handleViewAccount, handleEditAccount, handleStatusChange, isAdmin])

  // Estados de carga y error
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cuentas Corrientes</h2>
        </div>

        <div className="flex items-center justify-center min-h-96 bg-red-50 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error al cargar cuentas
            </h3>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calcular valores para paginación
  const totalPages = Math.ceil((accountsData?.meta?.total || 0) / (filters.pageSize || 20))
  const currentPage = filters.page || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cuentas Corrientes</h2>
          <p className="text-gray-600">
            {accountsData?.meta?.total || 0} cuentas registradas
          </p>
        </div>

        {isAdmin && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        )}
      </div>

      {/* Filtros */}
      <AccountFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableStatuses={accountsData?.meta?.availableStatuses || ['ACTIVE', 'OVERDUE', 'SUSPENDED', 'CLOSED']}
        availableDocumentTypes={accountsData?.meta?.availableDocumentTypes || ['DNI', 'CUIT']}
      />

      {/* Tabla usando la interfaz correcta del DataTable */}
      <DataTable
        columns={columns}
        data={accountsData?.data || []}
        pageCount={totalPages}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        initialPage={currentPage - 1} // DataTable usa índice base 0
        initialPageSize={filters.pageSize || 20}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : undefined}
        showSearch={false} // Ya tenemos filtros personalizados
        emptyMessage="No hay cuentas corrientes registradas"
        loadingMessage="Cargando cuentas..."
        errorMessage="Error al cargar las cuentas"
      />

      {/* Resumen */}
      {accountsData?.meta?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(accountsData.meta.summary.totalBalance || 0)}
            </p>
            <p className="text-sm text-gray-600">Deuda Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(accountsData.meta.summary.totalOverdue || 0)}
            </p>
            <p className="text-sm text-gray-600">Vencido</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(accountsData.meta.summary.avgBalance || 0)}
            </p>
            <p className="text-sm text-gray-600">Promedio</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {accountsData.meta.summary.accountsWithDebt || 0}
            </p>
            <p className="text-sm text-gray-600">Con Deuda</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {accountsData.meta.summary.accountsOverdue || 0}
            </p>
            <p className="text-sm text-gray-600">Vencidas</p>
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos */}
      {!isLoading && (!accountsData?.data || accountsData.data.length === 0) && (
        <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay cuentas corrientes
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primera cuenta corriente
            </p>
            {isAdmin && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Cuenta
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear cuenta */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Nueva Cuenta Corriente
            </DialogTitle>
          </DialogHeader>
          <CreateAccountForm
            onSuccess={() => {
              setShowCreateForm(false)
              queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}