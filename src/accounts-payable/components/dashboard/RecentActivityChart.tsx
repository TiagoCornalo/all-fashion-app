import { formatCurrency } from '../../../utils'

interface RecentActivityChartProps {
  data?: Record<string, { count: number; totalAmount: number }> | null
}

/**
 * Gráfico simple de actividad reciente
 */
export const RecentActivityChart = ({ data }: RecentActivityChartProps) => {
  // Validaciones defensivas para datos vacíos o undefined
  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hay datos de actividad</p>
          <p className="text-xs text-gray-400 mt-1">Error al cargar información</p>
        </div>
      </div>
    )
  }

  // Validar que data sea un objeto con propiedades
  if (typeof data !== 'object' || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hay actividad reciente</p>
          <p className="text-xs text-gray-400 mt-1">No se registraron transacciones en los últimos 7 días</p>
        </div>
      </div>
    )
  }

  try {
    // Filtrar y validar entradas válidas
    const validEntries = Object.entries(data)
      .filter(([date, activity]) => {
        // Validar que la fecha esté presente y la actividad tenga estructura válida
        return date &&
          activity &&
          typeof activity === 'object' &&
          typeof activity.count === 'number' &&
          typeof activity.totalAmount === 'number' &&
          !isNaN(activity.count) &&
          !isNaN(activity.totalAmount)
      })
      .slice(0, 7) // Solo últimos 7 días

    if (validEntries.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <p className="text-sm">No hay actividad válida</p>
            <p className="text-xs text-gray-400 mt-1">Los datos de actividad están corruptos o incompletos</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {validEntries.map(([date, activity]) => {
          // Validaciones adicionales por entrada
          const safeCount = Math.max(0, activity.count || 0)
          const safeAmount = activity.totalAmount || 0

          return (
            <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {date || 'Fecha no disponible'}
                </p>
                <p className="text-sm text-gray-600">
                  {safeCount} {safeCount === 1 ? 'transacción' : 'transacciones'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(safeAmount)}
                </p>
                {safeCount === 0 && (
                  <p className="text-xs text-gray-400">Sin movimientos</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Resumen total si hay múltiples días */}
        {validEntries.length > 1 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Total Período</p>
                <p className="text-sm text-blue-700">
                  {validEntries.reduce((sum, [, activity]) => sum + (activity.count || 0), 0)} transacciones
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-900">
                  {formatCurrency(
                    validEntries.reduce((sum, [, activity]) => sum + (activity.totalAmount || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch (error) {
    // Capturar cualquier error inesperado
    console.error('Error rendering RecentActivityChart:', error)
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Error al mostrar actividad</p>
          <p className="text-xs text-gray-400 mt-1">Problema al procesar los datos</p>
        </div>
      </div>
    )
  }
}