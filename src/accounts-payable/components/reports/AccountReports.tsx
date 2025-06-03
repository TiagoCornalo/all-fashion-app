import { Card, CardContent, CardHeader, CardTitle } from '../../../components'
import { FileText, BarChart, TrendingUp } from 'lucide-react'

/**
 * Componente de reportes para cuentas corrientes
 */
export const AccountReports = () => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reportes de Cuentas Corrientes</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Análisis y estadísticas detalladas
        </p>
      </div>

      {/* Reportes disponibles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Estado de Cuentas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Reporte detallado del estado actual de todas las cuentas corrientes
            </p>
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-gray-500">Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Análisis de Tendencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Evolución de deudas y pagos a lo largo del tiempo
            </p>
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-gray-500">Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              Reportes Financieros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Informes financieros exportables para análisis contable
            </p>
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-gray-500">Próximamente disponible</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder para futuros reportes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Reportes Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Reportes en Desarrollo
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
              Estamos trabajando en reportes avanzados que te permitirán obtener insights detallados
              sobre el comportamiento de tus cuentas corrientes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
