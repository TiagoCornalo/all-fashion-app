import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../../../components'
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react'
import { accountsPayableService, DashboardSummary } from '../../../services/accountsPayable.service'
import { formatCurrency, formatDateTime } from '../../../utils'
import {
  RecentActivityChart,
  FinancialSummaryChart,
  AccountStatusChart,
  InstallmentsWidgets
} from './'

/**
 * Dashboard principal con métricas y estadísticas de cuentas corrientes
 */
export const AccountsDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0)

  // Query para obtener resumen del dashboard
  const {
    data: summary,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardSummary>({
    queryKey: ['accounts-payable-dashboard', refreshKey],
    queryFn: () => accountsPayableService.getDashboardSummary(),
    retry: 2,
    staleTime: 30000 // 30 segundos
  })

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
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
    )
  }

  if (error) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Error al cargar dashboard
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm"
          >
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="p-4 sm:p-6">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">No hay datos disponibles</p>
        </div>
      </Card>
    )
  }

  const { accountCounts, financialSummary, recentActivity } = summary

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Financiero</h2>
          <p className="text-xs sm:text-sm text-gray-600 break-words">
            Actualizado: {formatDateTime(summary.generatedAt)}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          Actualizar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total de deuda */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary?.totalDebt ?? 0)}
            </div>
            <p className="text-xs text-gray-600 break-words">
              Límite: {formatCurrency(financialSummary?.totalCreditLimit ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Deuda vencida */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deuda Vencida</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-orange-600">
              {formatCurrency(financialSummary?.totalOverdue ?? 0)}
            </div>
            <p className="text-xs text-gray-600">
              {accountCounts?.overdue ?? 0} cuentas afectadas
            </p>
          </CardContent>
        </Card>

        {/* Utilización de crédito */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Utilización Crédito</CardTitle>
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {(financialSummary?.creditUtilization ?? 0 * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 break-words">
              Promedio: {formatCurrency(financialSummary?.avgBalance ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total de cuentas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Cuentas</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {accountCounts?.total ?? 0}
            </div>
            <p className="text-xs text-gray-600">
              {accountCounts?.active ?? 0} activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estados de cuentas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium">Activas</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {accountCounts?.active ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium">Vencidas</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-600">
                  {accountCounts?.overdue ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium">Suspendidas</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                  {accountCounts?.suspended ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium">Cerradas</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">
                  {accountCounts?.closed ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuotas vencidas y próximas a vencer */}
      <InstallmentsWidgets />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Resumen financiero */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialSummaryChart data={financialSummary} />
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Estado de Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountStatusChart data={accountCounts} />
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Actividad Reciente (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityChart data={recentActivity} />
        </CardContent>
      </Card>

      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              Alertas Financieras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financialSummary?.totalOverdue > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-orange-50 rounded-lg">
                <span className="text-xs sm:text-sm text-orange-800 break-words">
                  Hay deuda vencida por {formatCurrency(financialSummary?.totalOverdue ?? 0)}
                </span>
                <Badge variant="destructive" className="text-xs w-fit">
                  {accountCounts?.overdue ?? 0} cuentas
                </Badge>
              </div>
            )}

            {financialSummary?.creditUtilization > 0.8 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-yellow-50 rounded-lg">
                <span className="text-xs sm:text-sm text-yellow-800 break-words">
                  Alta utilización de crédito ({(financialSummary?.creditUtilization ?? 0 * 100).toFixed(1)}%)
                </span>
                <Badge variant="secondary" className="text-xs w-fit">Revisar</Badge>
              </div>
            )}

            {accountCounts?.suspended > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs sm:text-sm text-gray-800">
                  {accountCounts?.suspended ?? 0} cuentas suspendidas
                </span>
                <Badge variant="outline" className="text-xs w-fit">Gestionar</Badge>
              </div>
            )}

            {financialSummary?.totalOverdue === 0 &&
              financialSummary?.creditUtilization <= 0.8 &&
              accountCounts?.suspended === 0 && (
                <div className="flex items-center justify-center p-4 sm:p-6 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-2" />
                    <span className="text-xs sm:text-sm text-green-800">
                      Todo en orden - No hay alertas
                    </span>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Métricas Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Deuda Máxima:</span>
              <span className="font-semibold text-xs sm:text-sm break-all">
                {formatCurrency(financialSummary?.maxDebt ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Promedio por Cuenta:</span>
              <span className="font-semibold text-xs sm:text-sm break-all">
                {formatCurrency(financialSummary?.avgBalance ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Cuentas con Deuda:</span>
              <span className="font-semibold text-xs sm:text-sm">
                {accountCounts?.total - accountCounts?.closed}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600">Disponible Total:</span>
              <span className="font-semibold text-green-600 text-xs sm:text-sm break-all">
                {formatCurrency((financialSummary?.totalCreditLimit ?? 0) - (financialSummary?.totalDebt ?? 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}