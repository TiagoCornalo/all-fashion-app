import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  getTechnicalServiceById,
  changeServiceStatus,
  registerServicePayment
} from '../../services/technical-service.service'
import { TechnicalService, StatusChangeDto, RegisterPaymentDto, ServiceStatus } from '../../types/technical-service.types'
import ServiceStatusBadge from './ServiceStatusBadge'
import ServicePriorityBadge from './ServicePriorityBadge'
import AddPartDialog from './AddPartDialog'
import PaymentDialog from './PaymentDialog'
import { formatCurrency, formatDate } from '../../utils'
import { formatEquipmentInfo, formatTimeAgo } from '../utils/formatters'
import { STATUS_TRANSITIONS } from '../utils/constants'
import {
  Eye,
  X,
  Edit,
  Settings,
  Package,
  DollarSign,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Wrench,
  History,
  CreditCard,
  ShoppingCart,
  Save,
  Plus
} from 'lucide-react'

interface ServiceDetailDialogProps {
  serviceId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (service: TechnicalService) => void
}

/**
 * Dialog completo para ver detalles y gestionar servicios técnicos
 */
const ServiceDetailDialog = ({ serviceId, isOpen, onOpenChange, onEdit }: ServiceDetailDialogProps) => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditingCosts, setIsEditingCosts] = useState(false)
  const [tempCosts, setTempCosts] = useState({
    laborCost: 0,
    additionalCosts: 0
  })

  // Estado para cambio de status
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [newStatus, setNewStatus] = useState<ServiceStatus | ''>('')
  const [statusNotes, setStatusNotes] = useState('')

  // Estado para agregar pieza
  const [showAddPart, setShowAddPart] = useState(false)

  // Estado para pago
  const [showPayment, setShowPayment] = useState(false)

  // Consultar servicio
  const {
    data: service,
    isLoading,
    error
  } = useQuery({
    queryKey: ['technical-service', serviceId],
    queryFn: () => serviceId ? getTechnicalServiceById(serviceId) : null,
    enabled: !!serviceId && isOpen,
    staleTime: 30000
  })

  // Mutación para cambiar estado
  const changeStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StatusChangeDto }) => changeServiceStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['technical-services'] })
      setShowStatusChange(false)
      setStatusNotes('')
    }
  })

  const handleStatusChange = () => {
    if (serviceId && newStatus) {
      changeStatusMutation.mutate({
        id: serviceId,
        data: { newStatus: newStatus as ServiceStatus, notes: statusNotes }
      })
    }
  }

  const handleStartCostEdit = () => {
    if (service) {
      setTempCosts({
        laborCost: service.costs.laborCost,
        additionalCosts: service.costs.additionalCosts
      })
      setIsEditingCosts(true)
    }
  }

  const handleSaveCosts = () => {
    // Aquí se implementaría la mutación para actualizar costos
    console.log('Save costs:', tempCosts)
    setIsEditingCosts(false)
  }

  const handlePartAdded = () => {
    // Refrescar automáticamente al agregar pieza
    queryClient.invalidateQueries({ queryKey: ['technical-service', serviceId] })
    queryClient.invalidateQueries({ queryKey: ['technical-services'] })
  }

  if (!serviceId || !isOpen) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando servicio...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !service) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="text-center p-8">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error al cargar el servicio
            </h3>
            <p className="text-gray-600">
              No se pudo cargar la información del servicio técnico.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const availableNextStates = STATUS_TRANSITIONS[service.status] || []
  const canEdit = ['RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'APPROVED', 'WAITING_PARTS', 'IN_REPAIR', 'TESTING'].includes(service.status)
  const canAddParts = ['APPROVED', 'WAITING_PARTS', 'IN_REPAIR'].includes(service.status)
  const canChangeStatus = service.status !== 'DELIVERED' && service.status !== 'CANCELLED'
  const needsPayment = service.costs.totalCost > 0 && !service.payment.isPaid

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Servicio Técnico: {service.serviceNumber}
              </div>
              <div className="flex items-center gap-2">
                <ServiceStatusBadge status={service.status} size="sm" />
                <ServicePriorityBadge priority={service.priority} size="sm" />
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">General</TabsTrigger>
              <TabsTrigger value="costs">Costos</TabsTrigger>
              <TabsTrigger value="parts">Piezas</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            {/* Tab: Información General */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Información del Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User size={20} />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{service.customer.name}</h4>
                      <p className="text-sm text-gray-600">
                        {service.customer.documentType}: {service.customer.documentNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={16} className="text-gray-500" />
                      <span>{service.customer.phone}</span>
                    </div>

                    {service.customer.email && (
                      <div className="text-sm text-gray-600">
                        Email: {service.customer.email}
                      </div>
                    )}

                    {service.customer.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="text-gray-600">{service.customer.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Información del Equipo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      Equipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {formatEquipmentInfo(service.equipment)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Tipo: {service.equipment.type}
                      </p>
                    </div>

                    {service.equipment.serialNumber && (
                      <div className="text-sm">
                        <span className="text-gray-600">Serie:</span> {service.equipment.serialNumber}
                      </div>
                    )}

                    {service.equipment.color && (
                      <div className="text-sm">
                        <span className="text-gray-600">Color:</span> {service.equipment.color}
                      </div>
                    )}

                    {service.equipment.accessories.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">Accesorios:</span>
                        <ul className="list-disc list-inside ml-2">
                          {service.equipment.accessories.map((accessory, index) => (
                            <li key={index}>{accessory}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Problema Reportado */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText size={20} />
                    Problema Reportado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 mb-3">{service.customerReport.description}</p>

                  {service.customerReport.symptoms.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Síntomas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {service.customerReport.symptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {service.customerReport.whenStarted && (
                      <div>
                        <span className="text-gray-600">Cuándo comenzó:</span> {service.customerReport.whenStarted}
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Frecuencia:</span> {service.customerReport.frequency}
                    </div>
                  </div>

                  {service.customerReport.customerNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Notas del cliente:</span>
                      <p className="text-sm text-gray-600 mt-1">{service.customerReport.customerNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Fechas y Asignación */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock size={20} />
                      Fechas Importantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Recibido:</span>
                      <span>{formatDate(service.dates.receivedAt)}</span>
                    </div>

                    {service.dates.estimatedDelivery && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entrega estimada:</span>
                        <span>{formatDate(service.dates.estimatedDelivery)}</span>
                      </div>
                    )}

                    {service.dates.repairCompletedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reparación completada:</span>
                        <span>{formatDate(service.dates.repairCompletedAt)}</span>
                      </div>
                    )}

                    {service.dates.deliveredAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entregado:</span>
                        <span>{formatDate(service.dates.deliveredAt)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench size={20} />
                      Asignación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {service.assignedTechnician && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Técnico:</span>
                        <span>
                          {typeof service.assignedTechnician === 'object' && service.assignedTechnician?.name
                            ? service.assignedTechnician.name
                            : 'Sin asignar'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Creado por:</span>
                      <span>
                        {typeof service.createdBy === 'object' && service.createdBy?.name
                          ? service.createdBy.name
                          : 'Usuario desconocido'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Tiempo transcurrido:</span>
                      <span>{formatTimeAgo(service.dates.receivedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Costos */}
            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={20} />
                      Costos del Servicio
                    </div>
                    {canEdit && !isEditingCosts && (
                      <Button variant="outline" size="sm" onClick={handleStartCostEdit}>
                        <Edit size={16} className="mr-1" />
                        Editar Costos
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditingCosts ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costo de Mano de Obra
                          </label>
                          <input
                            type="number"
                            value={tempCosts.laborCost}
                            onChange={(e) => setTempCosts(prev => ({ ...prev, laborCost: Number(e.target.value) }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Costos Adicionales
                          </label>
                          <input
                            type="number"
                            value={tempCosts.additionalCosts}
                            onChange={(e) => setTempCosts(prev => ({ ...prev, additionalCosts: Number(e.target.value) }))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveCosts}>
                          <Save size={16} className="mr-1" />
                          Guardar
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingCosts(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(service.costs.laborCost)}
                          </div>
                          <div className="text-sm text-blue-800">Mano de Obra</div>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(service.costs.partsCost)}
                          </div>
                          <div className="text-sm text-green-800">Piezas</div>
                        </div>

                        <div className="p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(service.costs.additionalCosts)}
                          </div>
                          <div className="text-sm text-orange-800">Adicionales</div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900">
                            {formatCurrency(service.costs.totalCost)}
                          </div>
                          <div className="text-lg text-gray-600">Costo Total</div>
                        </div>
                      </div>

                      {/* Estado de pago */}
                      <div className="mt-4">
                        {service.payment.isPaid ? (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                            <div>
                              <div className="font-medium text-green-800">Pagado</div>
                              <div className="text-sm text-green-600">
                                {formatCurrency(service.payment.paidAmount)} - {service.payment.paymentMethod}
                                {service.payment.paidAt && ` - ${formatDate(service.payment.paidAt)}`}
                              </div>
                            </div>
                          </div>
                        ) : needsPayment ? (
                          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle size={20} className="text-yellow-600" />
                              <div>
                                <div className="font-medium text-yellow-800">Pendiente de Pago</div>
                                <div className="text-sm text-yellow-600">
                                  Total a pagar: {formatCurrency(service.costs.totalCost)}
                                </div>
                              </div>
                            </div>
                            <Button onClick={() => setShowPayment(true)}>
                              <CreditCard size={16} className="mr-1" />
                              Registrar Pago
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No hay costos definidos para este servicio
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Piezas */}
            <TabsContent value="parts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={20} />
                      Piezas Utilizadas ({service.partsUsed.length})
                    </div>
                    {canAddParts && (
                      <Button onClick={() => setShowAddPart(true)}>
                        <Plus size={16} className="mr-1" />
                        Agregar Pieza
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {service.partsUsed.length > 0 ? (
                    <div className="space-y-3">
                      {service.partsUsed.map((part) => (
                        <div key={part._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{part.product.name}</div>
                            <div className="text-sm text-gray-600">
                              Código: {part.product.code} | Cantidad: {part.quantity} |
                              Precio unitario: {formatCurrency(part.unitPrice)}
                            </div>
                            {part.notes && (
                              <div className="text-sm text-gray-500 mt-1">{part.notes}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(part.subtotal)}</div>
                            <div className="text-xs text-gray-500">
                              {formatDate(part.addedAt)}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center font-medium">
                          <span>Total en Piezas:</span>
                          <span>{formatCurrency(service.costs.partsCost)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No se han agregado piezas a este servicio</p>
                      {canAddParts && (
                        <Button className="mt-4" onClick={() => setShowAddPart(true)}>
                          <Plus size={16} className="mr-1" />
                          Agregar Primera Pieza
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Historial */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History size={20} />
                    Historial de Estados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {service.statusHistory.map((history, index) => (
                      <div key={history._id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                          {index < service.statusHistory.length - 1 && (
                            <div className="w-px h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <ServiceStatusBadge status={history.status} size="sm" />
                            <span className="text-sm text-gray-500">
                              {formatDate(history.changedAt)} - {history.changedBy}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-gray-600">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botones de acción */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button variant="outline" onClick={() => onEdit(service)}>
                  <Edit size={16} className="mr-1" />
                  Editar
                </Button>
              )}

              {canChangeStatus && availableNextStates.length > 0 && (
                <Button variant="outline" onClick={() => setShowStatusChange(true)}>
                  <Settings size={16} className="mr-1" />
                  Cambiar Estado
                </Button>
              )}
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X size={16} className="mr-1" />
              Cerrar
            </Button>
          </div>

          {/* Modal para cambio de estado */}
          {showStatusChange && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Cambiar Estado del Servicio</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nuevo Estado
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ServiceStatus)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar estado...</option>
                      {availableNextStates.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Notas sobre el cambio de estado..."
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || changeStatusMutation.isPending}
                    className="flex-1"
                  >
                    {changeStatusMutation.isPending ? 'Cambiando...' : 'Cambiar Estado'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStatusChange(false)
                      setNewStatus('')
                      setStatusNotes('')
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para pago */}
          {showPayment && (
            <PaymentDialog
              serviceId={serviceId}
              totalCost={service.costs.totalCost}
              isOpen={showPayment}
              onOpenChange={setShowPayment}
              onPaymentRegistered={() => {
                // El PaymentDialog ya invalida las queries necesarias
                setShowPayment(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de agregar pieza */}
      <AddPartDialog
        serviceId={serviceId}
        isOpen={showAddPart}
        onOpenChange={setShowAddPart}
        onPartAdded={handlePartAdded}
      />
    </>
  )
}

export default ServiceDetailDialog