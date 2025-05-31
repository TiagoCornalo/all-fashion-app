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
import { RecentActivityChart, FinancialSummaryChart, AccountStatusChart } from './'

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
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
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error al cargar dashboard
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-gray-600">No hay datos disponibles</p>
        </div>
      </Card>
    )
  }

  const { accountCounts, financialSummary, recentActivity } = summary

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h2>
          <p className="text-gray-600">
            Actualizado: {formatDateTime(summary.generatedAt)}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Actualizar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de deuda */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary?.totalDebt ?? 0)}
            </div>
            <p className="text-xs text-gray-600">
              Límite: {formatCurrency(financialSummary?.totalCreditLimit ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Deuda vencida */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Vencida</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
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
            <CardTitle className="text-sm font-medium">Utilización Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(financialSummary?.creditUtilization ?? 0 * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600">
              Promedio: {formatCurrency(financialSummary?.avgBalance ?? 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total de cuentas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cuentas</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {accountCounts?.total ?? 0}
            </div>
            <p className="text-xs text-gray-600">
              {accountCounts?.active ?? 0} activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estados de cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {accountCounts?.active ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vencidas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {accountCounts?.overdue ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Pause className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Suspendidas</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {accountCounts?.suspended ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Cerradas</p>
                <p className="text-2xl font-bold text-gray-600">
                  {accountCounts?.closed ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialSummaryChart data={financialSummary} />
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountStatusChart data={accountCounts} />
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityChart data={recentActivity} />
        </CardContent>
      </Card>

      {/* Alertas y notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas Financieras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financialSummary?.totalOverdue > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-800">
                  Hay deuda vencida por {formatCurrency(financialSummary?.totalOverdue ?? 0)}
                </span>
                <Badge variant="destructive">
                  {accountCounts?.overdue ?? 0} cuentas
                </Badge>
              </div>
            )}

            {financialSummary?.creditUtilization > 0.8 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-800">
                  Alta utilización de crédito ({(financialSummary?.creditUtilization ?? 0 * 100).toFixed(1)}%)
                </span>
                <Badge variant="secondary">Revisar</Badge>
              </div>
            )}

            {accountCounts?.suspended > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-800">
                  {accountCounts?.suspended ?? 0} cuentas suspendidas
                </span>
                <Badge variant="outline">Gestionar</Badge>
              </div>
            )}

            {financialSummary?.totalOverdue === 0 &&
              financialSummary?.creditUtilization <= 0.8 &&
              accountCounts?.suspended === 0 && (
                <div className="flex items-center justify-center p-6 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <span className="text-sm text-green-800">
                      Todo en orden - No hay alertas
                    </span>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Métricas Clave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Deuda Máxima:</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary?.maxDebt ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Promedio por Cuenta:</span>
              <span className="font-semibold">
                {formatCurrency(financialSummary?.avgBalance ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cuentas con Deuda:</span>
              <span className="font-semibold">
                {accountCounts?.total - accountCounts?.closed}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Disponible Total:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency((financialSummary?.totalCreditLimit ?? 0) - (financialSummary?.totalDebt ?? 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}