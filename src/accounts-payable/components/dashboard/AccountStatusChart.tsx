interface AccountCounts {
  total: number
  active: number
  overdue: number
  suspended: number
  closed: number
}

interface AccountStatusChartProps {
  data?: AccountCounts | null
}

/**
 * Gráfico de distribución de estados de cuentas
 */
export const AccountStatusChart = ({ data }: AccountStatusChartProps) => {
  // Validaciones defensivas para datos vacíos o undefined
  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hay datos disponibles</p>
          <p className="text-xs text-gray-400 mt-1">Error al cargar información</p>
        </div>
      </div>
    )
  }

  const { total, active, overdue, suspended, closed } = data

  // Validar que total no sea 0 o negativo
  if (!total || total <= 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hay cuentas registradas</p>
          <p className="text-xs text-gray-400 mt-1">Comienza creando una cuenta corriente</p>
        </div>
      </div>
    )
  }

  // Asegurar que los valores sean números válidos
  const safeActive = Math.max(0, active || 0)
  const safeOverdue = Math.max(0, overdue || 0)
  const safeSuspended = Math.max(0, suspended || 0)
  const safeClosed = Math.max(0, closed || 0)
  const safeTotal = Math.max(1, total || 1) // Evitar división por 0

  const statuses = [
    {
      label: 'Activas',
      count: safeActive,
      color: 'bg-green-500',
      percentage: (safeActive / safeTotal) * 100
    },
    {
      label: 'Vencidas',
      count: safeOverdue,
      color: 'bg-orange-500',
      percentage: (safeOverdue / safeTotal) * 100
    },
    {
      label: 'Suspendidas',
      count: safeSuspended,
      color: 'bg-yellow-500',
      percentage: (safeSuspended / safeTotal) * 100
    },
    {
      label: 'Cerradas',
      count: safeClosed,
      color: 'bg-gray-500',
      percentage: (safeClosed / safeTotal) * 100
    }
  ]

  // Filtrar estados con count > 0 para mostrar solo relevantes
  const relevantStatuses = statuses.filter(status => status.count > 0)

  if (relevantStatuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Sin estados activos</p>
          <p className="text-xs text-gray-400 mt-1">Todos los contadores en cero</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de distribución */}
      <div className="h-6 flex rounded-lg overflow-hidden">
        {relevantStatuses.map((status, index) => (
          <div
            key={index}
            className={`${status.color} transition-all duration-300`}
            style={{ width: `${status.percentage}%` }}
            title={`${status.label}: ${status.count} (${status.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Leyenda - mostrar todos los estados */}
      <div className="grid grid-cols-2 gap-2">
        {statuses.map((status, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{status.label}</span>
                <span className="text-sm font-semibold">{status.count}</span>
              </div>
              <div className="text-xs text-gray-500">
                {status.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <span className="text-lg font-bold text-gray-900">{safeTotal}</span>
        </div>
      </div>
    </div>
  )
}