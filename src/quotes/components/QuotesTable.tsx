import { useMemo } from 'react'
import { DataTable } from '../../components'
import { ColumnDef } from '@tanstack/react-table'
import { Quote } from '../../types/quote.types'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components'
import { formatCurrency, formatDate } from '../../utils'
import { MoreHorizontal, Pencil, Trash, Eye, ShoppingCart } from 'lucide-react'

interface QuotesTableProps {
  quotes: Quote[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (search: string) => void
  onFilterChange: (filters: Record<string, string>) => void
  onRefresh: () => Promise<void>
  onEdit: (quote: Quote) => void
  onDelete: (quote: Quote) => void
  onPreview: (quote: Quote) => void
  isLoading: boolean
  initialPage: number
  initialPageSize: number
}

const QuotesTable = ({
  quotes,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  onFilterChange,
  onRefresh,
  onEdit,
  onDelete,
  onPreview,
  isLoading,
  initialPage,
  initialPageSize
}: QuotesTableProps) => {
  const columns = useMemo<ColumnDef<Quote>[]>(
    () => [
      {
        accessorKey: 'number',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Número'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='font-medium text-xs sm:text-sm break-words'>{row.getValue('number')}</div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Tipo'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const type = row.getValue('type') as string
          const typeLabels = {
            'QUOTE': 'Presupuesto',
            'ESTIMATE': 'Cotización',
            'INVOICE': 'Factura'
          }
          return (
            <Badge variant="secondary" className="text-xs">
              {typeLabels[type as keyof typeof typeLabels] || type}
            </Badge>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'customer.name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Cliente'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm break-words max-w-[150px] sm:max-w-none">
            {row.original.customer.name}
          </div>
        ),
        enableSorting: false
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Total'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm font-semibold text-green-600 break-all">
            {formatCurrency(row.getValue('total'))}
          </div>
        ),
        enableSorting: true
      },
      {
        id: 'items',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Productos'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const items = row.original.items || []
          return (
            <div className="text-xs sm:text-sm">
              <span className="hidden sm:inline">{items.length} productos</span>
              <span className="sm:hidden">{items.length}</span>
            </div>
          )
        }
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
          const statusConfig = {
            'DRAFT': { label: 'Borrador', variant: 'secondary' as const },
            'SENT': { label: 'Enviado', variant: 'default' as const },
            'ACCEPTED': { label: 'Aceptado', variant: 'success' as const },
            'REJECTED': { label: 'Rechazado', variant: 'destructive' as const },
            'EXPIRED': { label: 'Expirado', variant: 'destructive' as const }
          }
          const config = statusConfig[status as keyof typeof statusConfig]
          return (
            <Badge variant={config?.variant || 'secondary'} className="text-xs">
              {config?.label || status}
            </Badge>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'validUntil',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Válido Hasta'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const validUntil = row.getValue('validUntil') as string
          return (
            <div className="text-xs sm:text-sm">
              {validUntil ? formatDate(validUntil) : 'Sin vencimiento'}
            </div>
          )
        },
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
          <div className="text-xs sm:text-sm">{formatDate(row.getValue('createdAt'))}</div>
        ),
        enableSorting: true
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <div className='flex items-center justify-end gap-1 sm:gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                    <MoreHorizontal className='h-3 w-3 sm:h-4 sm:w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                  <DropdownMenuItem onClick={() => onPreview(row.original)}>
                    <Eye className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                    Ver/Descargar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <Pencil className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                    Editar
                  </DropdownMenuItem>
                  {row.original.status === 'ACCEPTED' && (
                    <DropdownMenuItem onClick={() => {/* TODO: convertir a venta */ }}>
                      <ShoppingCart className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                      Convertir a Venta
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original)}
                    className='text-red-600'
                  >
                    <Trash className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
      }
    ],
    [onEdit, onDelete, onPreview]
  )

  return (
    <DataTable
      columns={columns}
      data={quotes}
      pageCount={pageCount}
      onPaginationChange={onPaginationChange}
      onSortingChange={onSortingChange}
      onFilterChange={onFilterChange}
      onSearchChange={onSearchChange}
      onRefresh={onRefresh}
      initialPage={initialPage}
      initialPageSize={initialPageSize}
      isLoading={isLoading}
      searchPlaceholder='Buscar remitos...'
      emptyMessage='No hay remitos disponibles'
    />
  )
}

export default QuotesTable