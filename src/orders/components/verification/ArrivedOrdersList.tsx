import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Loader
} from '../../../components'
import { Package, Eye, User } from 'lucide-react'
import { orderVerificationService } from '../../../services/orderVerification.service'
import { formatDateTime } from '../../../utils'
import { RECEPTION_STATUS } from './constants'

/**
 * Lista de pedidos que llegaron físicamente y están pendientes de verificación de cantidades
 */
const ArrivedOrdersList = () => {
  const navigate = useNavigate()

  // Query para obtener pedidos llegados pendientes de verificación
  const { data: ordersResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['arrived-orders-pending'],
    queryFn: () => orderVerificationService.getArrivedPendingVerification(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  })

  const handleVerifyOrder = (orderId: string) => {
    navigate(`/orders/verify/${orderId}`)
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
            <p className="text-red-600 mb-4">Error al cargar pedidos llegados</p>
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
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay pedidos para verificar
            </h3>
            <p className="text-gray-600">
              No se encontraron pedidos que hayan llegado y estén pendientes de verificación
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
            <Package className="h-5 w-5" />
            Pedidos para Verificar Cantidades
            <Badge variant="secondary" className="ml-auto">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Estos pedidos llegaron físicamente y necesitan verificación de cantidades
          </p>
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
                    <Package className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-lg">{order.supplier.name}</h3>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {RECEPTION_STATUS[order.receptionStatus as keyof typeof RECEPTION_STATUS]}
                    </Badge>
                    {order.employeeVerification?.verifiedBy && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Ya verificado
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Llegó el:</p>
                      <p className="text-gray-900">
                        {formatDateTime(order.actualArrivalDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Confirmado por:</p>
                      <p className="text-gray-900 flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {order.confirmedArrivalBy.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700">Productos:</p>
                      <p className="text-gray-900">{order.items.length} artículos</p>
                    </div>

                    {order?.totalValue && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Valor Total:</p>
                        <p className="text-gray-900 font-semibold">
                          ${order.totalValue?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lista de productos */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Productos a verificar:</p>
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

                  {/* Información de verificación si existe */}
                  {order?.adminApproval && !order?.adminApproval?.approved && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        Estado de Verificación:
                      </p>
                      <div className="text-sm text-yellow-700">

                        <p>
                          Notas del administrador: {order.adminApproval.adminNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <Button
                    onClick={() => handleVerifyOrder(order._id)}
                    className="flex items-center gap-2"
                    variant={order.employeeVerification ? "outline" : "default"}
                  >
                    <Eye className="h-4 w-4" />
                    {order.employeeVerification ? 'Ver Verificación' : 'Verificar Cantidades'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ArrivedOrdersList