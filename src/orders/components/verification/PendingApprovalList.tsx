import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Loader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea
} from '../../../components'
import { AlertTriangle, CheckCircle, XCircle, User, Package, MessageCircle } from 'lucide-react'
import { orderVerificationService, ArrivedOrder, AdminApprovalData } from '../../../services/orderVerification.service'
import { formatDateTime } from '../../../utils'
import { RECEPTION_STATUS } from './constants'

// Tipo para errores de API
interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
}

// Tipo para el contacto del proveedor
interface SupplierContact {
  phone?: string
  email?: string
}

/**
 * Lista de pedidos pendientes de aprobación por admin/manager
 */
const PendingApprovalList = () => {
  const [selectedOrder, setSelectedOrder] = useState<ArrivedOrder | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  // Query para obtener pedidos pendientes de aprobación
  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['pending-admin-approval'],
    queryFn: () => orderVerificationService.getPendingAdminApproval(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  // Mutation para aprobar/rechazar
  const approvalMutation = useMutation({
    mutationFn: ({ orderId, approvalData }: { orderId: string; approvalData: AdminApprovalData }) =>
      orderVerificationService.adminApproveVerification(orderId, approvalData),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['pending-admin-approval'] })
      queryClient.invalidateQueries({ queryKey: ['arrived-orders-pending'] })
      setIsApprovalDialogOpen(false)
      setAdminNotes('')
      setSelectedOrder(null)
      setApprovalAction(null)
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError
      const errorMessage = apiError.response?.data?.error || 'Error al procesar aprobación'
      toast.error(errorMessage)
    }
  })

  const handleApprovalAction = (order: ArrivedOrder, action: 'approve' | 'reject') => {
    setSelectedOrder(order)
    setApprovalAction(action)
    setIsApprovalDialogOpen(true)
  }

  const handleSubmitApproval = () => {
    if (!selectedOrder || !approvalAction) return

    const approvalData: AdminApprovalData = {
      approved: approvalAction === 'approve',
      adminNotes: adminNotes.trim() || undefined
    }

    approvalMutation.mutate({
      orderId: selectedOrder._id,
      approvalData
    })
  }

  const handleOpenWhatsApp = (phone: string) => {
    if (!phone) {
      toast.error('No hay número de teléfono disponible')
      return
    }

    // Limpiar el número de teléfono
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    toast.info('Abriendo WhatsApp Web...')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error al cargar pedidos pendientes</p>
            <Button onClick={() => refetch()} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const orders = ordersResponse?.data || []

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pedidos pendientes de aprobación
            </h3>
            <p className="text-gray-600">
              Todos los pedidos verificados han sido procesados
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con información */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              <span className="text-base sm:text-lg">Pedidos Pendientes de Aprobación</span>
            </div>
            <Badge variant="secondary" className="ml-0 sm:ml-auto w-fit">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <p className="text-xs sm:text-sm text-gray-600">
            Estos pedidos fueron verificados por empleados y requieren tu aprobación
          </p>
        </CardHeader>
      </Card>

      {/* Lista de pedidos */}
      <div className="grid gap-3 sm:gap-4">
        {orders.map((order) => (
          <Card key={order._id} className="border-orange-200 hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      <h3 className="font-semibold text-base sm:text-lg">{order.supplier.name}</h3>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs w-fit">
                      {RECEPTION_STATUS[order.receptionStatus as keyof typeof RECEPTION_STATUS]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Verificado el:</p>
                      <p className="text-sm sm:text-base text-gray-900">
                        {order.employeeVerification && formatDateTime(order.employeeVerification.verificationDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Verificado por:</p>
                      <p className="text-sm sm:text-base text-gray-900 flex items-center gap-1">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        {order.employeeVerification?.verifiedBy.name || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Productos:</p>
                      <p className="text-sm sm:text-base text-gray-900">{order.items.length} artículos</p>
                    </div>

                    {order.totalValue && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Valor Total:</p>
                        <p className="text-sm sm:text-base text-gray-900 font-semibold">
                          ${order.totalValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Estado de verificación */}
                  {order.employeeVerification && (
                    <div className={`p-3 sm:p-4 rounded-lg mb-4 ${order.employeeVerification.allCorrect
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                      }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`font-medium text-sm sm:text-base ${order.employeeVerification.allCorrect ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {order.employeeVerification.allCorrect
                              ? '✅ Verificación Exitosa'
                              : '⚠️ Problemas Reportados'
                            }
                          </h4>

                          {!order.employeeVerification.allCorrect && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs sm:text-sm text-red-700 font-medium">
                                Productos con problemas:
                              </p>
                              {order.employeeVerification.issues.map((issue, index) => {
                                const product = order.items.find(item => item.product._id === issue.product)
                                return (
                                  <div key={index} className="text-xs sm:text-sm text-red-700 bg-white p-2 rounded border">
                                    <p className="font-medium">
                                      {product?.product.name || 'Producto'} ({product?.product.code || 'N/A'})
                                    </p>
                                    <p>
                                      Esperado: {issue.expectedQuantity}, Recibido: {issue.receivedQuantity}
                                      {issue.receivedQuantity < issue.expectedQuantity &&
                                        ` (Faltan ${issue.expectedQuantity - issue.receivedQuantity})`
                                      }
                                      {issue.receivedQuantity > issue.expectedQuantity &&
                                        ` (Sobran ${issue.receivedQuantity - issue.expectedQuantity})`
                                      }
                                    </p>
                                    {issue.notes && (
                                      <p className="text-xs italic">Nota: {issue.notes}</p>
                                    )}
                                  </div>
                                )
                              })}

                              <Button
                                variant='outline'
                                size="sm"
                                onClick={() => {
                                  // Manejar diferentes formatos de contact
                                  let phone = ''
                                  if (order.supplier.contact) {
                                    if (typeof order.supplier.contact === 'string') {
                                      phone = order.supplier.contact
                                    } else if (typeof order.supplier.contact === 'object' && 'phone' in order.supplier.contact) {
                                      phone = (order.supplier.contact as SupplierContact).phone || ''
                                    }
                                  }
                                  handleOpenWhatsApp(phone)
                                }}
                                className="w-full sm:w-auto"
                              >
                                <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
                                <span className="text-xs sm:text-sm">Enviar mensaje al proveedor</span>
                              </Button>
                            </div>
                          )}

                          {order.employeeVerification.notes && (
                            <div className="mt-2">
                              <p className="text-xs sm:text-sm font-medium">Notas del empleado:</p>
                              <p className="text-xs sm:text-sm">{order.employeeVerification.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:ml-4 flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-auto">
                  <Button
                    onClick={() => handleApprovalAction(order, 'approve')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm"
                    disabled={approvalMutation.isPending}
                    size="sm"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Aprobar
                  </Button>
                  <Button
                    onClick={() => handleApprovalAction(order, 'reject')}
                    variant="destructive"
                    className="flex items-center gap-2 w-full sm:w-auto text-xs sm:text-sm"
                    disabled={approvalMutation.isPending}
                    size="sm"
                  >
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para aprobación/rechazo */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Aprobar Verificación' : 'Rechazar Verificación'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedOrder.supplier.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.items.length} productos
                </p>
                {selectedOrder.employeeVerification && (
                  <p className="text-sm text-gray-600">
                    {selectedOrder.employeeVerification.allCorrect
                      ? 'Todo verificado correctamente'
                      : `${selectedOrder.employeeVerification.issues.length} problema(s) reportado(s)`
                    }
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas de administrador {approvalAction === 'reject' ? '(requeridas)' : '(opcionales)'}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={
                    approvalAction === 'approve'
                      ? "Comentarios sobre la aprobación..."
                      : "Explica por qué se rechaza la verificación..."
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitApproval}
                  disabled={approvalMutation.isPending || (approvalAction === 'reject' && !adminNotes.trim())}
                  className={`flex-1 ${approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {approvalMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {approvalAction === 'approve' ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      {approvalAction === 'approve' ? 'Aprobar' : 'Rechazar'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsApprovalDialogOpen(false)}
                  variant="outline"
                  disabled={approvalMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PendingApprovalList