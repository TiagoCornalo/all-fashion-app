import { formatCurrency } from '../../../utils'
import { Progress } from '../../../components'

interface FinancialSummaryData {
  totalDebt: number
  totalOverdue: number
  avgBalance: number
  maxDebt: number
  totalCreditLimit: number
  creditUtilization: number
}

interface FinancialSummaryChartProps {
  data?: FinancialSummaryData | null
}

/**
 * Resumen visual de métricas financieras
 */
export const FinancialSummaryChart = ({ data }: FinancialSummaryChartProps) => {
  // Validaciones defensivas para datos vacíos o undefined
  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hay datos financieros</p>
          <p className="text-xs text-gray-400 mt-1">Error al cargar información</p>
        </div>
      </div>
    )
  }

  // Validar que data sea un objeto válido
  if (typeof data !== 'object') {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Datos inválidos</p>
          <p className="text-xs text-gray-400 mt-1">Formato de datos incorrecto</p>
        </div>
      </div>
    )
  }

  try {
    // Asegurar valores numéricos válidos con fallbacks seguros
    const safeData = {
      totalDebt: Math.max(0, Number(data.totalDebt) || 0),
      totalOverdue: Math.max(0, Number(data.totalOverdue) || 0),
      avgBalance: Math.max(0, Number(data.avgBalance) || 0),
      maxDebt: Math.max(0, Number(data.maxDebt) || 0),
      totalCreditLimit: Math.max(0, Number(data.totalCreditLimit) || 0),
      creditUtilization: Math.max(0, Math.min(100, Number(data.creditUtilization) || 0)) // Entre 0 y 100
    }

    // Verificar que al menos algunos datos sean válidos
    const hasValidData = Object.values(safeData).some(value => value > 0)

    if (!hasValidData) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <p className="text-sm">Sin actividad financiera</p>
            <p className="text-xs text-gray-400 mt-1">No hay transacciones registradas</p>
          </div>
        </div>
      )
    }

    const utilizationPercentage = Math.round(safeData.creditUtilization) // Ya viene como porcentaje
    const overduePercentage = safeData.totalDebt > 0
      ? Math.round((safeData.totalOverdue / safeData.totalDebt) * 100)
      : 0

    return (
      <div className="space-y-6">
        {/* Utilización de crédito */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Utilización de Crédito
            </span>
            <span className="text-sm text-gray-600">
              {utilizationPercentage}%
            </span>
          </div>
          <Progress
            value={utilizationPercentage}
            className="h-3 bg-gray-100"
            barClassName={utilizationPercentage > 80 ? 'bg-red-500' :
              utilizationPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
            }
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(safeData.totalDebt)}</span>
            <span>{formatCurrency(safeData.totalCreditLimit)}</span>
          </div>
          {safeData.totalCreditLimit === 0 && (
            <p className="text-xs text-gray-400 mt-1 text-center">
              No hay límites de crédito configurados
            </p>
          )}
        </div>

        {/* Deuda vencida */}
        {safeData.totalDebt > 0 && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Deuda Vencida
              </span>
              <span className="text-sm text-gray-600">
                {overduePercentage}%
              </span>
            </div>
            <Progress
              value={overduePercentage}
              className="h-3 bg-gray-100"
              barClassName={overduePercentage > 0 ? 'bg-orange-500' : 'bg-green-500'}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(safeData.totalOverdue)}</span>
              <span>{formatCurrency(safeData.totalDebt)}</span>
            </div>
            {overduePercentage === 0 && (
              <p className="text-xs text-green-600 mt-1 text-center">
                ✓ No hay deudas vencidas
              </p>
            )}
          </div>
        )}

        {/* Mensaje si no hay deuda */}
        {safeData.totalDebt === 0 && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              ✓ Sin deudas pendientes
            </p>
            <p className="text-xs text-green-600 mt-1">
              Todas las cuentas están al día
            </p>
          </div>
        )}

        {/* Métricas adicionales */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(safeData.avgBalance)}
            </p>
            <p className="text-xs text-gray-600">Promedio</p>
            {safeData.avgBalance === 0 && (
              <p className="text-xs text-gray-400">Sin balances</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(safeData.maxDebt)}
            </p>
            <p className="text-xs text-gray-600">Máximo</p>
            {safeData.maxDebt === 0 && (
              <p className="text-xs text-gray-400">Sin deudas</p>
            )}
          </div>
        </div>

        {/* Información adicional para debugging en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded">
            <details>
              <summary>Debug Info</summary>
              <pre className="mt-1">{JSON.stringify(safeData, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    )
  } catch (error) {
    // Capturar cualquier error inesperado
    console.error('Error rendering FinancialSummaryChart:', error)
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Error al mostrar resumen</p>
          <p className="text-xs text-gray-400 mt-1">Problema al procesar datos financieros</p>
        </div>
      </div>
    )
  }
}