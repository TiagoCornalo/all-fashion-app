import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components'
import { getDashboardStats } from '../../services/technical-service.service'
import { formatCurrency } from '../../utils'
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  RefreshCw
} from 'lucide-react'

/**
 * Dashboard con estadísticas y métricas de servicios técnicos
 */
const ServiceDashboard = () => {
  const {
    data: response,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 30000 // 30 segundos
  })

  const handleRefresh = () => {
    refetch()
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar las estadísticas</p>
            <Button onClick={handleRefresh} className="mt-2">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extraer datos de la respuesta del backend
  const stats = response?.data
  const overview = stats?.overview
  const breakdown = stats?.breakdown
  const revenue = stats?.revenue
  const recentActivity = stats?.recentActivity || []
  const topTechnicians = stats?.topTechnicians || []

  return (
    <div className="space-y-6">
      {/* Header con acción de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Resumen de servicios técnicos y métricas principales</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de servicios */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview?.totalServices || 0}
                    </p>
                  </div>
                  <Wrench className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {overview?.completionRate || 0}% completado
                </p>
              </CardContent>
            </Card>

            {/* Servicios activos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Proceso</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {overview?.activeServices || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {overview?.overdueServices || 0} vencidos
                </p>
              </CardContent>
            </Card>

            {/* Servicios completados hoy */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completados Hoy</p>
                    <p className="text-2xl font-bold text-green-600">
                      {overview?.completedToday || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Servicios finalizados
                </p>
              </CardContent>
            </Card>

            {/* Servicios vencidos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vencidos</p>
                    <p className={`text-2xl font-bold ${(overview?.overdueServices || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                      {overview?.overdueServices || 0}
                    </p>
                  </div>
                  <AlertTriangle className={`h-8 w-8 ${(overview?.overdueServices || 0) > 0 ? 'text-red-600' : 'text-gray-400'
                    }`} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Requieren atención
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas financieras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenue?.thisMonth || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {revenue?.paidServicesCount || 0} servicios pagados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tasa de Finalización</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {overview?.completionRate || 0}%
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Servicios completados vs total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por Estado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Servicios por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breakdown?.byStatus && Object.entries(breakdown.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{status.replace('_', ' ')}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                  {(!breakdown?.byStatus || Object.keys(breakdown.byStatus).length === 0) && (
                    <p className="text-sm text-gray-500">No hay servicios registrados</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Prioridad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Servicios por Prioridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {breakdown?.byPriority && Object.entries(breakdown.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{priority}:</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                  {(!breakdown?.byPriority || Object.keys(breakdown.byPriority).length === 0) && (
                    <p className="text-sm text-gray-500">No hay servicios registrados</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad Reciente y Técnicos Destacados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actividad Reciente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity: any) => (
                      <div
                        key={activity._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.serviceNumber}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {activity.customer.name} - {activity.equipment.brand} {activity.equipment.model}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'IN_REPAIR' ? 'bg-orange-100 text-orange-800' :
                                activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                              }`}>
                              {activity.status.replace('_', ' ')}
                            </span>
                            {activity.assignedTechnician && (
                              <span className="text-xs text-gray-500">
                                {activity.assignedTechnician.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No hay actividad reciente</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Técnicos Destacados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Técnicos Destacados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {topTechnicians.length > 0 ? (
                    topTechnicians.map((tech: any, index: number) => (
                      <div
                        key={tech.technicianId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                                index === 2 ? 'bg-orange-100 text-orange-800' :
                                  'bg-blue-100 text-blue-800'}
                          `}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tech.technicianName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {tech.completedServices} servicios | {formatCurrency(tech.totalRevenue || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {tech.avgCompletionDays ? `${tech.avgCompletionDays} días` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No hay datos de técnicos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información de última actualización */}
          <div className="text-center text-xs text-gray-500">
            Última actualización: {stats?.generatedAt ? new Date(stats.generatedAt).toLocaleString() : 'N/A'}
          </div>
        </>
      )}
    </div>
  )
}

export default ServiceDashboard