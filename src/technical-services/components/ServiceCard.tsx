import { useState } from 'react'
import { TechnicalService } from '../../types/technical-service.types'
import { Card, CardContent, Button } from '../../components'
import ServiceStatusBadge from './ServiceStatusBadge'
import ServicePriorityBadge from './ServicePriorityBadge'
import {
  formatEquipmentInfo,
  formatTimeAgo,
  formatOverdueStatus
} from '../utils/formatters'
import { formatCurrency, formatDate } from '../../utils'
import {
  Clock,
  User,
  Wrench,
  DollarSign,
  Calendar,
  AlertTriangle,
  Eye,
  Edit,
  Phone,
  MapPin,
  Package,
  FileText,
  Settings
} from 'lucide-react'

interface ServiceCardProps {
  service: TechnicalService
  onView: (service: TechnicalService) => void
  onEdit: (service: TechnicalService) => void
  onStatusChange: (service: TechnicalService) => void
  onAddPart: (service: TechnicalService) => void
  onPayment: (service: TechnicalService) => void
  className?: string
}

/**
 * Componente card innovador para mostrar servicios técnicos
 * Incluye información completa y acciones rápidas
 */
const ServiceCard = ({
  service,
  onView,
  onEdit,
  onStatusChange,
  onAddPart,
  onPayment,
  className = ''
}: ServiceCardProps) => {
  const [showActions, setShowActions] = useState(false)

  const overdueStatus = formatOverdueStatus(service)
  const equipmentInfo = formatEquipmentInfo(service.equipment)
  const timeAgo = formatTimeAgo(service.dates.receivedAt)

  const canEdit = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'APPROVED', 'WAITING_PARTS', 'IN_REPAIR', 'TESTING'].includes(service.status)
  const canAddParts = ['APPROVED', 'WAITING_PARTS', 'IN_REPAIR'].includes(service.status)
  const canChangeStatus = service.status !== 'DELIVERED' && service.status !== 'CANCELLED'
  const needsPayment = service.costs.totalCost > 0 && !service.payment.isPaid

  return (
    <Card
      className={`
        group hover:shadow-lg transition-all duration-200 border-l-4
        ${overdueStatus.isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500'}
        ${service.priority === 'URGENT' ? 'ring-2 ring-red-200 animate-pulse' : ''}
        ${className}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4 sm:p-6">
        {/* Header con número de servicio y estado */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {service.serviceNumber}
              </h3>
              {service.templateInfo?.createdFromTemplate && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 border border-purple-200">
                  <FileText size={12} />
                  Template
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ServiceStatusBadge status={service.status} size="sm" />
              <ServicePriorityBadge priority={service.priority} size="sm" />
              {overdueStatus.isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700 border border-red-200">
                  <AlertTriangle size={12} />
                  {overdueStatus.message}
                </span>
              )}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className={`
            flex items-center gap-1 transition-opacity duration-200
            ${showActions ? 'opacity-100' : 'opacity-0 sm:opacity-100'}
          `}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(service)}
              className="h-8 w-8 p-0"
            >
              <Eye size={16} />
            </Button>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(service)}
                className="h-8 w-8 p-0"
              >
                <Edit size={16} />
              </Button>
            )}

            {canChangeStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(service)}
                className="h-8 w-8 p-0"
              >
                <Settings size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Información del cliente y equipo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={16} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {service.customer.name}
              </span>
            </div>

            {service.customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">
                  {service.customer.phone}
                </span>
              </div>
            )}

            {service.customer.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">
                  {service.customer.address}
                </span>
              </div>
            )}
          </div>

          {/* Equipo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Wrench size={16} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium text-gray-900 truncate">
                {equipmentInfo}
              </span>
            </div>

            {service.equipment.serialNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Package size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">
                  S/N: {service.equipment.serialNumber}
                </span>
              </div>
            )}

            {service.assignedTechnician && (
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-gray-600 truncate">
                  Técnico: {service.assignedTechnician.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Problema reportado */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            <span className="font-medium text-gray-900">Problema:</span>{' '}
            {service.customerReport.description}
          </p>
        </div>

        {/* Información de costos y fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Costo */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={16} className="text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900">
                {formatCurrency(service.costs.totalCost)}
              </div>
              {needsPayment && (
                <div className="text-xs text-red-600">Pendiente de pago</div>
              )}
              {service.payment.isPaid && (
                <div className="text-xs text-green-600">Pagado</div>
              )}
            </div>
          </div>

          {/* Fecha de ingreso */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-gray-500 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-gray-900">
                {formatDate(service.dates.receivedAt)}
              </div>
              <div className="text-xs text-gray-600">{timeAgo}</div>
            </div>
          </div>

          {/* Entrega estimada */}
          {service.dates.estimatedDelivery && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium text-gray-900">
                  {formatDate(service.dates.estimatedDelivery)}
                </div>
                <div className={`text-xs ${overdueStatus.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {overdueStatus.message || 'Entrega estimada'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Piezas utilizadas */}
        {service.partsUsed.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Piezas: {service.partsUsed.length}
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(service.costs.partsCost)}
              </span>
            </div>
          </div>
        )}

        {/* Botones de acción principales */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
          {canAddParts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddPart(service)}
              className="flex-1 sm:flex-none"
            >
              <Package size={16} className="mr-1" />
              Agregar Pieza
            </Button>
          )}

          {needsPayment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPayment(service)}
              className="flex-1 sm:flex-none"
            >
              <DollarSign size={16} className="mr-1" />
              Registrar Pago
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => onView(service)}
            className="flex-1 sm:flex-none"
          >
            <Eye size={16} className="mr-1" />
            Ver Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServiceCard