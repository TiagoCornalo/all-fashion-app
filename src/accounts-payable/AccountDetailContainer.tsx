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
      <Badge className={`flex items-center gap-1 ${config.color}`}>
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
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
        <div className="p-6">

          <div className="flex items-center justify-center min-h-96 bg-red-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error al cargar la cuenta
              </h3>
              <p className="text-gray-600 mb-4">
                {error.message || 'Error desconocido'}
              </p>
              <Button onClick={() => refetch()}>
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
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
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
        <div className="p-6">

          <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cuenta no encontrada
              </h3>
              <p className="text-gray-600">
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
      <div className="p-6">
        {/* Header con navegación */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {account.customer.name}
              </h1>
              <p className="text-gray-600">
                {account.customer.documentType}: {account.customer.documentNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(account.status)}
            {isAdmin && (
              <Button onClick={() => navigate(`/accounts-payable/${id}/edit`)}>
                Editar Cuenta
              </Button>
            )}
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${account.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(account.currentBalance)}
              </div>
              <p className="text-xs text-gray-600">
                {account.currentBalance > 0 ? 'Deuda pendiente' : 'Cuenta al día'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Límite de Crédito</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(account.creditLimit)}
              </div>
              <p className="text-xs text-gray-600">
                {creditUtilization.toFixed(1)}% utilizado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${account.overdueAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(account.overdueAmount)}
              </div>
              <p className="text-xs text-gray-600">
                {account.overdueAmount > 0 ? 'Requiere atención' : 'Sin vencimientos'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Condiciones</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Información general */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información del cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Datos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre completo</p>
                    <p className="font-semibold">{account.customer.name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-semibold">
                      {account.customer.documentType}: {account.customer.documentNumber}
                    </p>
                  </div>

                  {account.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <p className="font-semibold">{account.customer.phone}</p>
                      </div>
                    </div>
                  )}

                  {account.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{account.customer.email}</p>
                      </div>
                    </div>
                  )}

                  {account.customer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-semibold">
                          {account.customer.address.street}
                        </p>
                        <p className="text-sm text-gray-600">
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
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Datos de la Cuenta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <div className="mt-1">
                      {getStatusBadge(account.status)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Límite de crédito</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(account.creditLimit)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Crédito disponible</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(account.creditLimit - account.currentBalance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Utilización de crédito</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{creditUtilization.toFixed(1)}%</span>
                        <span>{formatCurrency(account.currentBalance)} / {formatCurrency(account.creditLimit)}</span>
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

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Creada</p>
                      <p className="font-semibold">{formatDateTime(account.createdAt)}</p>
                      <p className="text-xs text-gray-500">por {account.createdBy.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Movimientos */}
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Últimos Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                {account.transactions && account.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {account.transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">{getTransactionType(transaction.type)}</p>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.type === 'SALE' ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {transaction.type === 'SALE' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay movimientos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Resumen */}
          <TabsContent value="summary" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                {account.summary ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{account.summary.totalTransactions}</p>
                      <p className="text-sm text-gray-600">Total Transacciones</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{account.summary.totalSales}</p>
                      <p className="text-sm text-gray-600">Ventas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{account.summary.totalPayments}</p>
                      <p className="text-sm text-gray-600">Pagos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{account.summary.averageMonthlyActivity}</p>
                      <p className="text-sm text-gray-600">Promedio Mensual</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay resumen disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Notas */}
          <TabsContent value="notes" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notas Públicas</CardTitle>
                </CardHeader>
                <CardContent>
                  {account.notes ? (
                    <p className="text-gray-700">{account.notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">Sin notas públicas</p>
                  )}
                </CardContent>
              </Card>

              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notas Internas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {account.internalNotes ? (
                      <p className="text-gray-700">{account.internalNotes}</p>
                    ) : (
                      <p className="text-gray-500 italic">Sin notas internas</p>
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