import { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components'
import {
  Eye,
  Ellipsis,
  Pencil,
  Trash,
  Check,
  X,
  CheckCircle,
  Send,
  Truck
} from 'lucide-react'
import { ShoppingCart } from '../../assets'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '../../utils'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'
import {
  getOrders,
  completeOrder,
  sendOrder,
  approveOrder,
  rejectOrder,
} from '../../services/order'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import SupplierOrderEditDialog from './SupplierOrderEditDialog'
import DeleteOrderDialog from './DeleteOrderDialog'
import { toast } from 'react-toastify'
import { useIsMobile } from '../../hooks'
import ScheduleArrivalDialog from './ScheduleArrivalDialog'

// Definir los tipos para las órdenes
interface OrderProduct {
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

interface Order {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  items: OrderProduct[]
  status: 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'IN_TRANSIT'
  notes?: string
  createdAt: string
  updatedAt: string
  createdFrom: 'MANUAL' | 'AUTO'
  totalQuantity: number
  relatedAlerts: unknown[]
  __v: number
}

interface OrdersResponse {
  data: Order[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

const SuppliersOrders = () => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isScheduleArrivalDialogOpen, setIsScheduleArrivalDialogOpen] = useState(false)
  const isMobile = useIsMobile()

  // Consultar las órdenes con React Query
  const {
    data: orders,
    isLoading,
    refetch
  } = useQuery<OrdersResponse>({
    queryKey: ['orders', pagination, sorting, filters, search],
    queryFn: async () =>
      getOrders({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        ...filters
      })
  })

  useEffect(() => {
    if (orders?.meta) {
      if (orders.meta.page !== pagination.page) {
        setPagination((prev) => ({ ...prev, page: orders.meta.page }))
      }
    }
  }, [orders])

  const handleEdit = (order: Order) => {
    setSelectedOrder(order)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  const handleOrderUpdated = () => {
    refetch()
  }

  const handleComplete = async (order: Order) => {
    try {
      await completeOrder(order._id)
      toast.success('Orden completada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al completar la orden')
    }
  }

  const handleInTransit = (order: Order) => {
    setSelectedOrder(order)
    setIsScheduleArrivalDialogOpen(true)
  }

  const handleSendOrder = async (order: Order) => {
    const rawPhone = order.supplier?.contact?.phone
    if (!rawPhone) {
      toast.error('Este proveedor no tiene teléfono cargado. Editalo antes de enviar el pedido.')
      return
    }
    // Obtener el número de teléfono del proveedor
    const phoneNumber = rawPhone.replace(/\D/g, '')

    // Construir el mensaje
    const message = `Hola, soy de All Fashion Distribuidora. Te envío el pedido #${order._id.substring(
      0,
      8
    )}.

  Productos:
  ${order.items
        .map((item) => `- ${item.product?.name}: ${item.quantity} unidades`)
        .join('\n')}

  Estado: ${order.status}
  Notas: ${order.notes || 'Sin notas'}

  Por favor, confirma la recepción de este pedido.`

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message)

    // Crear el enlace de WhatsApp según el dispositivo
    const whatsappUrl = isMobile
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`

    // Abrir en una nueva pestaña
    window.open(whatsappUrl, '_blank')

    // Actualizar el estado a SENT
    try {
      await sendOrder(order._id)
      toast.success('Orden enviada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al marcar la orden como enviada')
    }
  }

  const handleApproveOrder = async (order: Order) => {
    try {
      await approveOrder(order._id)
      toast.success('Orden aprobada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al aprobar la orden')
    }
  }

  const handleRejectOrder = async (order: Order) => {
    try {
      await rejectOrder(order._id)
      toast.success('Orden rechazada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al rechazar la orden')
    }
  }

  // Definir las columnas de la tabla
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: 'supplier',
        accessorFn: (row) => row.supplier?.name,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Proveedor'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='font-medium'>{row.getValue('supplier')}</div>
        ),
        enableSorting: true
      },
      {
        id: 'totalQuantity',
        accessorFn: (row) => row.totalQuantity,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Productos'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('totalQuantity')}</div>,
        enableSorting: true
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Estado'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const status = row.getValue('status') as string

          const statusColors: Record<string, string> = {
            PENDING: 'bg-yellow-500 text-white',
            SENT: 'bg-blue-500 text-white',
            APPROVED: 'bg-green-500 text-white',
            REJECTED: 'bg-red-500 text-white',
            COMPLETED: 'bg-green-500 text-white',
            IN_TRANSIT: 'bg-blue-500 text-white'
          }

          const statusText: Record<string, string> = {
            PENDING: 'Pendiente',
            SENT: 'Enviado',
            APPROVED: 'Aprobado',
            REJECTED: 'Rechazado',
            COMPLETED: 'Completado',
            IN_TRANSIT: 'En transito'
          }

          return (
            <div>
              <Badge variant={'default'} className={statusColors[status]}>
                {statusText[status] || status}
              </Badge>
            </div>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'createdFrom',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Origen'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('createdFrom')}</div>,
        enableSorting: true
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Fecha'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div>{formatDateTime(new Date(row.getValue('createdAt')))}</div>
        ),
        enableSorting: true
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <div className='flex items-center justify-end gap-2'>
              <Link to={`/orders/${row.original._id}`}>
                <Button variant='outline' size='sm'>
                  <Eye className='h-4 w-4' />
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Ellipsis className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {row.original.status !== 'COMPLETED' &&
                    <DropdownMenuItem onClick={() => handleEdit(row.original)} className='cursor-pointer'>
                      <Pencil className='mr-2 h-4 w-4' />
                      Editar
                    </DropdownMenuItem>
                  }
                  <DropdownMenuItem
                    onClick={() => handleDelete(row.original)}
                    className='text-red-600 cursor-pointer'
                  >
                    <Trash className='mr-2 h-4 w-4' />
                    Eliminar
                  </DropdownMenuItem>
                  {row.original.status !== 'SENT' &&
                    row.original.status !== 'APPROVED' &&
                    row.original.status !== 'COMPLETED' &&
                    row.original.status !== 'IN_TRANSIT' && (
                      <DropdownMenuItem
                        onClick={() => handleSendOrder(row.original)}
                        className='text-blue-600 cursor-pointer'
                      >
                        <Send className='mr-2 h-4 w-4' />
                        Enviar
                      </DropdownMenuItem>
                    )}

                  {row.original.status !== 'APPROVED' &&
                    row.original.status !== 'COMPLETED' && row.original.status !== 'IN_TRANSIT' && (
                      <DropdownMenuItem
                        onClick={() => handleApproveOrder(row.original)}
                        className='text-green-600 cursor-pointer'
                      >
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Aprobar
                      </DropdownMenuItem>
                    )}

                  {row.original.status !== 'REJECTED' &&
                    row.original.status !== 'COMPLETED' && row.original.status !== 'IN_TRANSIT' && (
                      <DropdownMenuItem
                        onClick={() => handleRejectOrder(row.original)}
                        className='text-red-600 cursor-pointer'
                      >
                        <X className='mr-2 h-4 w-4' />
                        Rechazar
                      </DropdownMenuItem>
                    )}
                  {row.original.status !== 'COMPLETED' && (
                    <DropdownMenuItem
                      onClick={() => handleComplete(row.original)}
                      className='text-green-600 cursor-pointer'
                    >
                      <Check className='mr-2 h-4 w-4' />
                      Completar
                    </DropdownMenuItem>
                  )}
                  {row.original.status !== 'IN_TRANSIT' && row.original.status !== 'COMPLETED' && (
                    <DropdownMenuItem
                      onClick={() => handleInTransit(row.original)}
                      className='text-blue-600 cursor-pointer'
                    >
                      <Truck className='mr-2 h-4 w-4' />
                      En transito
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
      }
    ],
    [handleEdit, handleDelete]
  )

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  return (
    <>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {/* @ts-ignore */}
            <ShoppingCart className='h-6 w-6' />
            Pedidos a Proveedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={(orders?.data || []) as Order[]}
            pageCount={orders?.meta?.totalPages || 0}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            initialPage={pagination.page - 1}
            initialPageSize={pagination.pageSize}
            isLoading={isLoading}
            emptyMessage='No hay órdenes registradas'
            searchPlaceholder='Buscar orden...'
          />
        </CardContent>
      </Card>

      <SupplierOrderEditDialog
        order={selectedOrder}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onOrderUpdated={handleOrderUpdated}
      />

      <DeleteOrderDialog
        order={selectedOrder}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onOrderDeleted={handleOrderUpdated}
      />

      <ScheduleArrivalDialog
        order={selectedOrder}
        isOpen={isScheduleArrivalDialogOpen}
        onOpenChange={setIsScheduleArrivalDialogOpen}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  )
}

export default SuppliersOrders
