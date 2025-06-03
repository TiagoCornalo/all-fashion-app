import { ServiceStatus } from '../../types/technical-service.types'
import { getStatusColor, getProgressPercentage } from '../utils/statusColors'
import { STATUS_LABELS } from '../utils/constants'

interface ServiceStatusBadgeProps {
  status: ServiceStatus
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Componente para mostrar el estado de un servicio técnico con colores y progreso
 */
const ServiceStatusBadge = ({
  status,
  showProgress = false,
  size = 'md',
  className = ''
}: ServiceStatusBadgeProps) => {
  const colors = getStatusColor(status)
  const progress = getProgressPercentage(status)
  const label = STATUS_LABELS[status]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`
          inline-flex items-center font-medium rounded-full border
          ${colors.bg} ${colors.text} ${colors.border}
          ${sizeClasses[size]}
        `}
      >
        {label}
      </span>

      {showProgress && (
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
                }`}
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 font-medium whitespace-nowrap">
            {progress}%
          </span>
        </div>
      )}
    </div>
  )
}

export default ServiceStatusBadge