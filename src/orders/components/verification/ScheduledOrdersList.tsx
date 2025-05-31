import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
  Badge,
  Loader
} from '../../../components'
import { Calendar, Package, CheckCircle, Clock } from 'lucide-react'
import { orderVerificationService, ScheduledOrder } from '../../../services/orderVerification.service'
import { formatDateTime } from '../../../utils'
import { RECEPTION_STATUS } from './constants'

/**
 * Lista de pedidos programados para llegar hoy
 * Permite confirmar llegada física
 */
const ScheduledOrdersList = () => {
  const [selectedOrder, setSelectedOrder] = useState<ScheduledOrder | null>(null)
  const [confirmationNotes, setConfirmationNotes] = useState('')
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  // Query para obtener pedidos programados
  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-orders-today'],
    queryFn: () => orderVerificationService.getScheduledForToday(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  // Mutation para confirmar llegada física
  const confirmArrivalMutation = useMutation({
    mutationFn: ({ orderId, notes }: { orderId: string; notes?: string }) =>
      orderVerificationService.confirmPhysicalArrival(orderId, notes),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['scheduled-orders-today'] })
      queryClient.invalidateQueries({ queryKey: ['arrived-orders-pending'] })
      setIsConfirmDialogOpen(false)
      setConfirmationNotes('')
      setSelectedOrder(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al confirmar llegada')
    }
  })

  const handleConfirmArrival = (order: ScheduledOrder) => {
    setSelectedOrder(order)
    setIsConfirmDialogOpen(true)
  }

  const handleSubmitConfirmation = () => {
    if (!selectedOrder) return

    confirmArrivalMutation.mutate({
      orderId: selectedOrder._id,
      notes: confirmationNotes.trim() || undefined
    })
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
            <p className="text-red-600 mb-4">Error al cargar pedidos programados</p>
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
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pedidos programados para hoy
            </h3>
            <p className="text-gray-600">
              No se encontraron pedidos programados para llegar el día de hoy
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pedidos Programados para Hoy
            <Badge variant="secondary" className="ml-auto">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          {ordersResponse?.meta?.notifications && (
            <p className="text-sm text-gray-600">
              {ordersResponse.meta.notifications.message}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Lista de pedidos */}
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">{order.supplier.name}</h3>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {RECEPTION_STATUS[order.receptionStatus as keyof typeof RECEPTION_STATUS]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Programado para:</p>
                      <p className="text-gray-900">
                        {formatDateTime(order.scheduledArrivalDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Productos:</p>
                      <p className="text-gray-900">{order.items.length} artículos</p>
                    </div>

                    {order.totalValue && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Valor Total:</p>
                        <p className="text-gray-900 font-semibold">
                          ${order.totalValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lista de productos */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Productos esperados:</p>
                    <div className="space-y-1">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.product.name} ({item.product.code})
                          </span>
                          <span className="font-medium">{item.quantity} unidades</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} productos más...
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => handleConfirmArrival(order)}
                    className="flex items-center gap-2"
                    disabled={confirmArrivalMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Llegada
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para confirmar llegada */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Llegada Física</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedOrder.supplier.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.items.length} productos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <Textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Observaciones sobre la llegada del pedido..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitConfirmation}
                  disabled={confirmArrivalMutation.isPending}
                  className="flex-1"
                >
                  {confirmArrivalMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Llegada
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(false)}
                  variant="outline"
                  disabled={confirmArrivalMutation.isPending}
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

export default ScheduledOrdersList