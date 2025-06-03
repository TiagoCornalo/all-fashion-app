import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Button } from '../../components'
import { getTechnicalServices } from '../../services/technical-service.service'
import ServiceCard from './ServiceCard'
import ServiceFilters from './ServiceFilters'
import CreateServiceDialog from './CreateServiceDialog'
import ServiceDetailDialog from './ServiceDetailDialog'
import { TechnicalService, TechnicalServiceFilters } from '../../types/technical-service.types'
import { DEFAULT_PAGE_SIZE } from '../utils/constants'
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'

/**
 * Lista de servicios técnicos con filtros, búsqueda y paginación
 */
const ServicesList = () => {
  const [filters, setFilters] = useState<TechnicalServiceFilters>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado para dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  // const [showEditDialog, setShowEditDialog] = useState(false)
  // const [showStatusDialog, setShowStatusDialog] = useState(false)
  // const [showAddPartDialog, setShowAddPartDialog] = useState(false)
  // const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Consultar servicios
  const {
    data: servicesData,
    isLoading,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['technical-services', filters],
    queryFn: () => getTechnicalServices(filters),
    staleTime: 30000 // 30 segundos
  })

  const services = servicesData?.data || []
  const meta = servicesData?.meta

  // Aplicar búsqueda local si hay término de búsqueda
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services

    const search = searchTerm.toLowerCase()
    return services.filter(service =>
      service.serviceNumber.toLowerCase().includes(search) ||
      service.customer.name.toLowerCase().includes(search) ||
      service.customer.phone.includes(search) ||
      service.equipment.brand.toLowerCase().includes(search) ||
      service.equipment.model.toLowerCase().includes(search) ||
      (service.equipment.serialNumber && service.equipment.serialNumber.toLowerCase().includes(search)) ||
      service.customerReport.description.toLowerCase().includes(search)
    )
  }, [services, searchTerm])

  // Handlers para acciones
  const handleFilterChange = (newFilters: Partial<TechnicalServiceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleServiceView = (service: TechnicalService) => {
    setSelectedServiceId(service._id)
    setShowDetailDialog(true)
  }

  const handleServiceEdit = (service: TechnicalService) => {
    console.log('Edit service:', service.serviceNumber)
    // setSelectedService(service)
    // setShowEditDialog(true)
  }

  const handleStatusChange = (service: TechnicalService) => {
    console.log('Change status for service:', service.serviceNumber)
    // setSelectedService(service)
    // setShowStatusDialog(true)
  }

  const handleAddPart = (service: TechnicalService) => {
    console.log('Add part to service:', service.serviceNumber)
    // setSelectedService(service)
    // setShowAddPartDialog(true)
  }

  const handlePayment = (service: TechnicalService) => {
    console.log('Register payment for service:', service.serviceNumber)
    // setSelectedService(service)
    // setShowPaymentDialog(true)
  }

  const handleSortChange = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newOrder }))
  }

  const handleCreateService = () => {
    setShowCreateDialog(true)
  }

  const handleServiceCreated = () => {
    setShowCreateDialog(false)
    refetch() // Refrescar la lista después de crear
  }

  const handleDetailDialogClose = () => {
    setShowDetailDialog(false)
    setSelectedServiceId(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error al cargar los servicios técnicos</p>
            <Button onClick={handleRefresh} className="mt-2">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header con acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Servicios Técnicos
            </h2>
            <p className="text-gray-600">
              {meta ? `${meta.total} servicios encontrados` : 'Cargando...'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCreateService}
              className="flex-1 sm:flex-none"
            >
              <Plus size={16} className="mr-2" />
              Nuevo Servicio
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="flex-shrink-0"
            >
              <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por número, cliente, teléfono, equipo, serie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-2">
                {/* Toggle filtros */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-blue-50 text-blue-600' : ''}
                >
                  <Filter size={16} className="mr-2" />
                  Filtros
                </Button>

                {/* Toggle vista */}
                <div className="flex border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500'}`}
                  >
                    <List size={16} />
                  </button>
                </div>

                {/* Ordenamiento */}
                <Button
                  variant="outline"
                  onClick={() => handleSortChange('createdAt')}
                  className="flex items-center gap-1"
                >
                  {filters.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  Fecha
                </Button>
              </div>
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ServiceFilters
                  filters={filters}
                  onChange={handleFilterChange}
                  onReset={() => setFilters({
                    page: 1,
                    pageSize: DEFAULT_PAGE_SIZE,
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de servicios */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
            }`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
              }`}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  onView={handleServiceView}
                  onEdit={handleServiceEdit}
                  onStatusChange={handleStatusChange}
                  onAddPart={handleAddPart}
                  onPayment={handlePayment}
                />
              ))}
            </div>

            {/* Paginación */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange({ page: Math.max(1, filters.page! - 1) })}
                  disabled={filters.page === 1}
                >
                  Anterior
                </Button>

                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {filters.page} de {meta.totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handleFilterChange({ page: Math.min(meta.totalPages, filters.page! + 1) })}
                  disabled={filters.page === meta.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Search size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron servicios' : 'No hay servicios técnicos'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? 'Prueba con otros términos de búsqueda o ajusta los filtros'
                    : 'Crea tu primer servicio técnico para comenzar'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={handleCreateService}>
                    <Plus size={16} className="mr-2" />
                    Crear Primer Servicio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de creación */}
      <CreateServiceDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onServiceCreated={handleServiceCreated}
      />

      {/* Dialog de detalle */}
      <ServiceDetailDialog
        serviceId={selectedServiceId}
        isOpen={showDetailDialog}
        onOpenChange={handleDetailDialogClose}
        onEdit={handleServiceEdit}
      />
    </>
  )
}

export default ServicesList