import { ServicePriority } from '../../types/technical-service.types'
import { getPriorityColor, isPriorityHigh } from '../utils/statusColors'
import { PRIORITY_LABELS } from '../utils/constants'
import { AlertTriangle, Clock, ArrowUp, Zap } from 'lucide-react'

interface ServicePriorityBadgeProps {
  priority: ServicePriority
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Componente para mostrar la prioridad de un servicio técnico con colores e iconos
 */
const ServicePriorityBadge = ({
  priority,
  showIcon = true,
  size = 'md',
  className = ''
}: ServicePriorityBadgeProps) => {
  const colors = getPriorityColor(priority)
  const label = PRIORITY_LABELS[priority]
  const isHigh = isPriorityHigh(priority)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  const getIcon = () => {
    const iconSize = iconSizes[size]

    switch (priority) {
      case 'URGENT':
        return <Zap size={iconSize} className="animate-pulse" />
      case 'HIGH':
        return <AlertTriangle size={iconSize} />
      case 'NORMAL':
        return <ArrowUp size={iconSize} />
      case 'LOW':
        return <Clock size={iconSize} />
      default:
        return <Clock size={iconSize} />
    }
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${isHigh ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {showIcon && getIcon()}
      {label}
    </span>
  )
}

export default ServicePriorityBadge