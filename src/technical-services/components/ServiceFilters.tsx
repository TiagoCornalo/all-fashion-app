import { useState } from 'react'
import { Button } from '../../components'
import { TechnicalServiceFilters } from '../../types/technical-service.types'
import {
  CalendarIcon,
  FilterX,
  Search
} from 'lucide-react'

interface ServiceFiltersProps {
  filters: TechnicalServiceFilters
  onChange: (filters: Partial<TechnicalServiceFilters>) => void
  onReset: () => void
}

/**
 * Componente de filtros avanzados para servicios técnicos
 */
const ServiceFilters = ({ filters, onChange, onReset }: ServiceFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<Partial<TechnicalServiceFilters>>({
    status: filters.status,
    priority: filters.priority,
    equipmentType: filters.equipmentType,
    assignedTechnician: filters.assignedTechnician,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    isPaid: filters.isPaid,
    isOverdue: filters.isOverdue
  })

  const handleFilterChange = (key: keyof TechnicalServiceFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value }
    setLocalFilters(updatedFilters)
    onChange(updatedFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      status: undefined,
      priority: undefined,
      equipmentType: undefined,
      assignedTechnician: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      isPaid: undefined,
      isOverdue: undefined
    }
    setLocalFilters(resetFilters)
    onReset()
  }

  const hasActiveFilters = Object.values(localFilters).some(value =>
    value !== undefined && value !== '' && value !== null
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Filtros Avanzados</h4>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <FilterX size={14} className="mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Estado */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={localFilters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="RECEIVED">Recibido</option>
            <option value="DIAGNOSING">Diagnosticando</option>
            <option value="WAITING_APPROVAL">Esperando Aprobación</option>
            <option value="APPROVED">Aprobado</option>
            <option value="WAITING_PARTS">Esperando Piezas</option>
            <option value="IN_REPAIR">En Reparación</option>
            <option value="TESTING">Probando</option>
            <option value="COMPLETED">Completado</option>
            <option value="DELIVERED">Entregado</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="WARRANTY_CLAIM">Garantía</option>
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Prioridad
          </label>
          <select
            value={localFilters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las prioridades</option>
            <option value="LOW">Baja</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>

        {/* Tipo de Equipo */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tipo de Equipo
          </label>
          <select
            value={localFilters.equipmentType || ''}
            onChange={(e) => handleFilterChange('equipmentType', e.target.value || undefined)}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los equipos</option>
            <option value="CLIPPER">Máquina de Cortar</option>
            <option value="TRIMMER">Recortadora</option>
            <option value="SHAVER">Afeitadora</option>
            <option value="DRYER">Secador</option>
            <option value="STERILIZER">Esterilizador</option>
            <option value="CHAIR">Silla</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        {/* Estado de Pago */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Estado de Pago
          </label>
          <select
            value={localFilters.isPaid === undefined ? '' : localFilters.isPaid ? 'true' : 'false'}
            onChange={(e) => handleFilterChange('isPaid', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="true">Pagado</option>
            <option value="false">Pendiente</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Fecha Desde
          </label>
          <div className="relative">
            <input
              type="date"
              value={localFilters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
            />
            <CalendarIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Fecha Hasta
          </label>
          <div className="relative">
            <input
              type="date"
              value={localFilters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
            />
            <CalendarIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Filtros especiales */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filtros Especiales
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.isOverdue === true}
                onChange={(e) => handleFilterChange('isOverdue', e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Solo vencidos</span>
            </label>
          </div>
        </div>

        {/* Técnico Asignado - Placeholder por ahora */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Técnico
          </label>
          <input
            type="text"
            value={localFilters.assignedTechnician || ''}
            onChange={(e) => handleFilterChange('assignedTechnician', e.target.value || undefined)}
            placeholder="ID del técnico..."
            className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {Object.entries(localFilters).map(([key, value]) => {
              if (value === undefined || value === '' || value === null) return null

              let displayValue = String(value)
              let displayKey = key

              // Formatear nombres de filtros
              switch (key) {
                case 'status':
                  displayKey = 'Estado'
                  break
                case 'priority':
                  displayKey = 'Prioridad'
                  break
                case 'equipmentType':
                  displayKey = 'Equipo'
                  break
                case 'isPaid':
                  displayKey = 'Pago'
                  displayValue = value ? 'Pagado' : 'Pendiente'
                  break
                case 'isOverdue':
                  displayKey = 'Vencido'
                  displayValue = 'Sí'
                  break
                case 'dateFrom':
                  displayKey = 'Desde'
                  break
                case 'dateTo':
                  displayKey = 'Hasta'
                  break
                case 'assignedTechnician':
                  displayKey = 'Técnico'
                  break
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {displayKey}: {displayValue}
                  <button
                    onClick={() => handleFilterChange(key as keyof TechnicalServiceFilters, undefined)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <Search size={12} className="rotate-45" />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceFilters