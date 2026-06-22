import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components'
import {
  CheckCircle,
  Eye,
  AlertTriangle,
  Package,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-toastify'
import { getPendingAdminApproval } from '../../services/order'
import AdminApprovalDialog from './AdminApprovalDialog'
import { RECEPTION_STATUS } from '../../orders/components/verification/constants'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    code: string
    price: number
  } | null
  quantity: number
  currentStock: number
  minimumStock: number
  unitCost?: number
  costCurrency?: 'ARS' | 'USD'
}

interface PendingOrder {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  } | null
  items: OrderItem[]
  status: string
  receptionStatus: string
  employeeVerification: {
    verifiedBy: {
      _id: string
      name: string
    }
    verificationDate: string
    employeeNotes?: string
    discrepancies?: Array<{
      productId: string
      expectedQuantity: number
      receivedQuantity: number
      notes: string
    }>
  } | null
  confirmedArrivalBy: {
    _id: string
    name: string
  }
  scheduledArrivalDate?: string
  notes?: string
  createdAt: string
  totalQuantity: number
}

interface PendingApprovalResponse {
  data: PendingOrder[]
  meta: {
    total: number
    pendingApproval: number
  }
}

/**
 * Componente para mostrar pedidos pendientes de aprobación del admin
 */
const PendingApprovalTable = () => {
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)

  // Consultar pedidos pendientes usando React Query
  const {
    data: pendingOrders,
    isLoading,
    refetch,
    error
  } = useQuery<PendingApprovalResponse>({
    queryKey: ['pendingAdminApproval'],
    queryFn: getPendingAdminApproval,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    refetchOnWindowFocus: true
  })

  const orders = pendingOrders?.data || []
  const totalPending = pendingOrders?.meta?.pendingApproval || 0

  /**
   * Abre el modal de aprobación con el pedido seleccionado
   */
  const handleReviewOrder = (order: PendingOrder) => {
    setSelectedOrder(order)
    setIsApprovalDialogOpen(true)
  }

  /**
   * Refresca la lista manualmente
   */
  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Lista actualizada')
    } catch {
      toast.error('Error al actualizar la lista')
    }
  }

  /**
   * Callback cuando se actualiza un pedido
   */
  const handleOrderUpdated = () => {
    refetch()
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-600' />
            Error al cargar pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <p className='text-red-600 mb-4'>No se pudieron cargar los pedidos pendientes</p>
            <Button onClick={handleRefresh} variant='outline'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-blue-600' />
              <h3 className='text-lg font-semibold'>Pedidos Pendientes de Aprobación</h3>
              <Badge variant='secondary' className='ml-2'>
                {totalPending} pendiente{totalPending !== 1 ? 's' : ''}
              </Badge>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className='text-center py-8'>
              <RefreshCw className='h-8 w-8 mx-auto mb-4 animate-spin text-gray-400' />
              <p className='text-gray-500'>Cargando pedidos pendientes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <CheckCircle className='h-12 w-12 mx-auto mb-4 text-gray-300' />
              <p className='text-lg font-medium'>No hay pedidos pendientes</p>
              <p className='text-sm'>
                Los pedidos verificados por empleados aparecerán aquí para su aprobación
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Verificado por</TableHead>
                    <TableHead>Fecha verificación</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Discrepancias</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className='text-right'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {order.supplier?.name || 'Proveedor no disponible'}
                          </div>
                          <div className='text-sm text-gray-500'>
                            ID: {order._id.slice(-8)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4 text-gray-500' />
                          <div>
                            <div className='font-medium'>
                              {order.employeeVerification?.verifiedBy?.name || 'Usuario no disponible'}
                            </div>
                            <div className='text-sm text-gray-500'>
                              Confirmó: {order.confirmedArrivalBy?.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Calendar className='h-4 w-4 text-gray-500' />
                          <div>
                            <div className='font-medium'>
                              {new Date(order.employeeVerification.verificationDate).toLocaleDateString('es-ES')}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {new Date(order.employeeVerification.verificationDate).toLocaleTimeString('es-ES')}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Package className='h-4 w-4 text-gray-500' />
                          <div>
                            <div className='font-medium'>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</div>
                            <div className='text-sm text-gray-500'>
                              {order.totalQuantity} unidades total
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {order.employeeVerification.discrepancies && order.employeeVerification.discrepancies.length > 0 ? (
                          <div className='flex items-center gap-2'>
                            <AlertTriangle className='h-4 w-4 text-red-500' />
                            <Badge variant='destructive' className='text-xs'>
                              {order.employeeVerification.discrepancies.length} discrepancia{order.employeeVerification.discrepancies.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2'>
                            <CheckCircle className='h-4 w-4 text-green-500' />
                            <Badge variant='default' className='bg-green-100 text-green-800 text-xs'>
                              Sin discrepancias
                            </Badge>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
                          {RECEPTION_STATUS[order.receptionStatus as keyof typeof RECEPTION_STATUS]}
                        </Badge>
                      </TableCell>

                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          onClick={() => handleReviewOrder(order)}
                          className='bg-blue-600 hover:bg-blue-700'
                        >
                          <Eye className='h-4 w-4 mr-1' />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de aprobación/rechazo */}
      <AdminApprovalDialog
        order={selectedOrder}
        isOpen={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  )
}

export default PendingApprovalTable
