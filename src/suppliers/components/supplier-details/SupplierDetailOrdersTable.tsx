import { useState } from 'react'
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
} from '../../../components'
import {
  Eye,
  ShoppingCart,
  Pencil,
  Trash,
  MoreHorizontal,
  CheckCircle,
  Send,
  X
} from 'lucide-react'
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '../../../utils'
import { DataTableColumnHeader } from '../../../components/shared/DataTableColumnHeader'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../../../services/order'
import { OrderDetail } from '../../../types/order.types'
import {
  completeOrder,
  sendOrder,
  rejectOrder,
  approveOrder
} from '../../../services/order'
import { toast } from 'react-toastify'
import { useIsMobile } from '../../../hooks/use-mobile'

interface SupplierDetailOrdersTableProps {
  supplierId: string
  onEditOrder?: (order: OrderDetail) => void
  onDeleteOrder?: (order: OrderDetail) => void
}

const SupplierDetailOrdersTable = ({
  supplierId,
  onEditOrder,
  onDeleteOrder
}: SupplierDetailOrdersTableProps) => {
  const isMobile = useIsMobile()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<Record<string, string>>({
    supplier: supplierId
  })
  const [search, setSearch] = useState('')

  const {
    data: ordersResponse,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [
      'supplierOrders',
      supplierId,
      pagination,
      sorting,
      filters,
      search
    ],
    queryFn: () =>
      getOrders({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        ...filters
      }),
    enabled: !!supplierId
  })

  const orders = ordersResponse?.data || []
  const pageCount = ordersResponse?.meta?.totalPages || 0

  const handleCompleteOrder = async (order: OrderDetail) => {
    try {
      await completeOrder(order._id)
      toast.success('Orden completada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al completar la orden')
    }
  }

  const handleSendOrder = async (order: OrderDetail) => {
    // Obtener el número de teléfono del proveedor
    const phoneNumber = order.supplier.contact.phone.replace(/\D/g, '')

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

    // Crear el enlace de WhatsApp
    const whatsappUrl = isMobile
      ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      : `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`

    // Abrir en una nueva pestaña
    window.open(whatsappUrl, '_blank')

    // Actualizar el estado a SENT
    try {
      // Llamar al servicio para cambiar estado a enviado (necesitarías crear este endpoint)
      await sendOrder(order._id)
      toast.success('Orden enviada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al marcar la orden como enviada')
    }
  }

  const handleRejectOrder = async (order: OrderDetail) => {
    try {
      await rejectOrder(order._id)
      toast.success('Orden rechazada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al rechazar la orden')
    }
  }

  const handleApproveOrder = async (order: OrderDetail) => {
    try {
      await approveOrder(order._id)
      toast.success('Orden aprobada correctamente')
      refetch()
    } catch (error) {
      console.error(error)
      toast.error('Error al aprobar la orden')
    }
  }

  const columns = useMemo<ColumnDef<OrderDetail>[]>(
    () => [
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
            COMPLETED: 'bg-green-500 text-white'
          }

          const statusText: Record<string, string> = {
            PENDING: 'Pendiente',
            SENT: 'Enviado',
            APPROVED: 'Aprobado',
            REJECTED: 'Rechazado',
            COMPLETED: 'Completado'
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

              {(onEditOrder || onDeleteOrder) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {onEditOrder && (
                      <DropdownMenuItem
                        onClick={() => onEditOrder(row.original)}
                      >
                        <Pencil className='mr-2 h-4 w-4' />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDeleteOrder && (
                      <DropdownMenuItem
                        onClick={() => onDeleteOrder(row.original)}
                        className='text-red-600'
                      >
                        <Trash className='mr-2 h-4 w-4' />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                    {row.original.status !== 'SENT' &&
                      row.original.status !== 'APPROVED' &&
                      row.original.status !== 'COMPLETED' && (
                        <DropdownMenuItem
                          onClick={() => handleSendOrder(row.original)}
                          className='text-blue-600'
                        >
                          <Send className='mr-2 h-4 w-4' />
                          Enviar
                        </DropdownMenuItem>
                      )}
                    {row.original.status !== 'REJECTED' &&
                      row.original.status !== 'COMPLETED' && (
                        <DropdownMenuItem
                          onClick={() => handleRejectOrder(row.original)}
                          className='text-red-600'
                        >
                          <X className='mr-2 h-4 w-4' />
                          Rechazar
                        </DropdownMenuItem>
                      )}
                    {row.original.status !== 'APPROVED' &&
                      row.original.status !== 'COMPLETED' && (
                        <DropdownMenuItem
                          onClick={() => handleApproveOrder(row.original)}
                          className='text-green-600'
                        >
                          <CheckCircle className='mr-2 h-4 w-4' />
                          Aprobar
                        </DropdownMenuItem>
                      )}
                    {row.original.status !== 'COMPLETED' && (
                      <DropdownMenuItem
                        onClick={() => handleCompleteOrder(row.original)}
                        className='text-green-600'
                      >
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Completar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        }
      }
    ],
    [onEditOrder, onDeleteOrder]
  )

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters({ ...newFilters, supplier: supplierId })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <ShoppingCart className='h-6 w-6' />
          Pedidos del Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={orders}
          pageCount={pageCount}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          initialPage={pagination.page - 1}
          initialPageSize={pagination.pageSize}
          isLoading={isLoading}
          emptyMessage='No hay órdenes para este proveedor'
          searchPlaceholder='Buscar orden...'
        />
      </CardContent>
    </Card>
  )
}

export default SupplierDetailOrdersTable
