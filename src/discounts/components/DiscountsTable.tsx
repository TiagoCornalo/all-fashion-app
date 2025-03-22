import { useMemo } from 'react'
import { DataTable } from '../../components'
import { ColumnDef } from '@tanstack/react-table'
import { Discount } from '../../types/discount.types'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components'
import { formatDateTime } from '../../utils'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

interface DiscountsTableProps {
  discounts: Discount[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (search: string) => void
  onRefresh: () => Promise<void>
  onEdit: (discount: Discount) => void
  onDelete: (discount: Discount) => void
  isLoading: boolean
  initialPage: number
  initialPageSize: number
}

const DiscountsTable = ({
  discounts,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  onRefresh,
  onEdit,
  onDelete,
  isLoading,
  initialPage,
  initialPageSize
}: DiscountsTableProps) => {
  const columns = useMemo<ColumnDef<Discount>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Código'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='font-medium'>{row.getValue('code')}</div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'description',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Descripción'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('description')}</div>,
        enableSorting: true
      },
      {
        accessorKey: 'discountPercentage',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Descuento'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('discountPercentage')}%</div>,
        enableSorting: true
      },
      {
        accessorKey: 'usageLimit',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Límite de uso'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const limit = row.getValue('usageLimit')
          return <div>{limit === null ? 'Ilimitado' : limit}</div>
        },
        enableSorting: true
      },
      {
        accessorKey: 'currentUsageCount',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Usos actuales'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('currentUsageCount')}</div>,
        enableSorting: true
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Estado'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Inicia'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const date = row.getValue('startDate') as Date
          return <div>{date ? formatDateTime(new Date(date)) : 'N/A'}</div>
        },
        enableSorting: true
      },
      {
        accessorKey: 'endDate',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Termina'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const date = row.getValue('endDate') as Date
          return <div>{date ? formatDateTime(new Date(date)) : 'N/A'}</div>
        },
        enableSorting: true
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <div className='flex items-center justify-end gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <MoreHorizontal className='h-4 w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original)}
                    className='text-red-600'
                  >
                    <Trash className='mr-2 h-4 w-4' />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
      }
    ],
    [onEdit, onDelete]
  )

  const handleFilterChange = (newFilters: Record<string, string>) => {
    // No se implementa ya que no parece necesario para el caso de descuentos
  }

  return (
    <DataTable
      columns={columns}
      data={discounts}
      pageCount={pageCount}
      onPaginationChange={onPaginationChange}
      onSortingChange={onSortingChange}
      onFilterChange={handleFilterChange}
      onSearchChange={onSearchChange}
      onRefresh={onRefresh}
      initialPage={initialPage}
      initialPageSize={initialPageSize}
      isLoading={isLoading}
      searchPlaceholder='Buscar descuentos...'
      emptyMessage='No hay descuentos disponibles'
    />
  )
}

export default DiscountsTable
