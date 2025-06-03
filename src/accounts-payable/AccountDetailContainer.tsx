import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutMultiRole } from '../layout'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components'
import {
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle
} from 'lucide-react'
import { accountsPayableService, AccountPayable } from '../services/accountsPayable.service'
import { formatCurrency, formatDateTime } from '../utils'
import { useAuth } from '../context/auth/useAuth'

/**
 * Contenedor para el detalle de una cuenta corriente
 */
const AccountDetailContainer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Convertir role a string para la comparación
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const canAccessAccounts = isAdmin || isManager

  // Query para obtener los detalles de la cuenta
  const {
    data: account,
    isLoading,
    error,
    refetch
  } = useQuery<AccountPayable, Error>({
    queryKey: ['account-detail', id],
    queryFn: () => {
      if (!id) throw new Error('ID de cuenta requerido')
      return accountsPayableService.getAccountById(id)
    },
    enabled: !!id && canAccessAccounts,
    retry: 2,
    retryDelay: 1000
  })

  // Función para obtener badge de estado
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
      <Badge className={`flex items-center gap-1 ${config.color} text-xs sm:text-sm`}>
        <Icon className="h-3 w-3" />
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    )
  }

  const getTransactionType = (type: string) => {
    const transactionTypes = {
      SALE: 'Venta',
      PAYMENT: 'Pago',
      TRANSFER: 'Transferencia'
    }

    return transactionTypes[type as keyof typeof transactionTypes] || type
  }

  if (!canAccessAccounts) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER']} showGoBackButton={true}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Solo administradores y managers pueden acceder a los detalles de cuentas
            </p>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  if (error) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']} showGoBackButton={true}>
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center min-h-96 bg-red-50 rounded-lg">
            <div className="text-center p-4">
              <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Error al cargar la cuenta
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {error.message || 'Error desconocido'}
              </p>
              <Button onClick={() => refetch()} size="sm" className="text-xs sm:text-sm">
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  if (isLoading) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']} showGoBackButton={true}>
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  if (!account) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']} showGoBackButton={true}>
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
            <div className="text-center p-4">
              <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Cuenta no encontrada
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                La cuenta solicitada no existe o no tienes permisos para verla
              </p>
            </div>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  const creditUtilization = account.creditLimit > 0
    ? (account.currentBalance / account.creditLimit) * 100
    : 0

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']} showGoBackButton={true}>
      <div className="p-2 sm:p-4 lg:p-6">
        {/* Header con navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {account.customer.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {account.customer.documentType}: {account.customer.documentNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {getStatusBadge(account.status)}
            {isAdmin && (
              <Button
                onClick={() => navigate(`/accounts-payable/${id}/edit`)}
                size="sm"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Editar Cuenta
              </Button>
            )}
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Saldo Actual</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold ${account.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(account.currentBalance)}
              </div>
              <p className="text-xs text-gray-600">
                {account.currentBalance > 0 ? 'Deuda pendiente' : 'Cuenta al día'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Límite de Crédito</CardTitle>
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-blue-600">
                {formatCurrency(account.creditLimit)}
              </div>
              <p className="text-xs text-gray-600">
                {creditUtilization.toFixed(1)}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Vencido</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold ${account.overdueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(account.overdueAmount)}
              </div>
              <p className="text-xs text-gray-600">
                {account.overdueAmount > 0 ? 'Requiere atención' : 'Sin vencimientos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Condiciones</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-purple-600">
                {account.paymentTerms.days} días
              </div>
              <p className="text-xs text-gray-600">
                {(account.paymentTerms.interestRate * 100).toFixed(2)}% interés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con información detallada */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Información</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Movimientos</span>
              <span className="sm:hidden">Mov.</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              Notas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Información general */}
          <TabsContent value="overview" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Información del cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    Datos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Nombre completo</p>
                    <p className="font-semibold text-sm sm:text-base break-words">{account.customer.name}</p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Documento</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {account.customer.documentType}: {account.customer.documentNumber}
                    </p>
                  </div>

                  {account.customer.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Teléfono</p>
                        <p className="font-semibold text-sm sm:text-base break-all">{account.customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {account.customer.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-sm sm:text-base break-all">{account.customer.email}</p>
                      </div>
                    </div>
                  )}

                  {account.customer.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Dirección</p>
                        <p className="font-semibold text-sm sm:text-base break-words">
                          {account.customer.address.street}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {account.customer.address.city}, {account.customer.address.state} ({account.customer.address.postalCode})
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información de la cuenta */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    Datos de la Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Estado</p>
                    <div className="mt-1">
                      {getStatusBadge(account.status)}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Límite de crédito</p>
                    <p className="font-semibold text-blue-600 text-sm sm:text-base">
                      {formatCurrency(account.creditLimit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Crédito disponible</p>
                    <p className="font-semibold text-green-600 text-sm sm:text-base">
                      {formatCurrency(account.creditLimit - account.currentBalance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Utilización de crédito</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span>{creditUtilization.toFixed(1)}%</span>
                        <span className="break-all">{formatCurrency(account.currentBalance)} / {formatCurrency(account.creditLimit)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${creditUtilization > 80 ? 'bg-red-500' :
                            creditUtilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-gray-600">Creada</p>
                      <p className="font-semibold text-sm sm:text-base">{formatDateTime(account.createdAt)}</p>
                      <p className="text-xs text-gray-500">por {account.createdBy.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Movimientos */}
          <TabsContent value="transactions" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Últimos Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                {account.transactions && account.transactions.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {account.transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base">{getTransactionType(transaction.type)}</p>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
                        </div>
                        <div className="text-right sm:text-right">
                          <p className={`font-semibold text-sm sm:text-base ${transaction.type === 'SALE' ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {transaction.type === 'SALE' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No hay movimientos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Resumen */}
          <TabsContent value="summary" className="mt-4 sm:mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Resumen de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                {account.summary ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{account.summary.totalTransactions}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Total Transacciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{account.summary.totalSales}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Ventas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{account.summary.totalPayments}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Pagos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{account.summary.averageMonthlyActivity}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Promedio Mensual</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm sm:text-base text-gray-600">No hay resumen disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Notas */}
          <TabsContent value="notes" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Notas Públicas</CardTitle>
                </CardHeader>
                <CardContent>
                  {account.notes ? (
                    <p className="text-gray-700 text-sm sm:text-base break-words">{account.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic text-sm sm:text-base">Sin notas públicas</p>
                  )}
                </CardContent>
              </Card>

              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Notas Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {account.internalNotes ? (
                      <p className="text-gray-700 text-sm sm:text-base break-words">{account.internalNotes}</p>
                    ) : (
                      <p className="text-gray-500 italic text-sm sm:text-base">Sin notas internas</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutMultiRole>
  )
}

export default AccountDetailContainer