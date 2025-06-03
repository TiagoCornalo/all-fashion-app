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
import { MoreHorizontal, Pencil, Trash, History } from 'lucide-react'

interface DiscountsTableProps {
  discounts: Discount[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (search: string) => void
  onRefresh: () => Promise<void>
  onEdit: (discount: Discount) => void
  onDelete: (discount: Discount) => void
  onViewHistory: (discount: Discount) => void
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
  onViewHistory,
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
          <div className='font-medium text-xs sm:text-sm break-words'>{row.getValue('code')}</div>
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
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm break-words max-w-[200px] sm:max-w-none">
            {row.getValue('description')}
          </div>
        ),
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
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm font-semibold text-green-600">
            {row.getValue('discountPercentage')}%
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'usageLimit',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Límite'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const limit = row.getValue('usageLimit')
          return (
            <div className="text-xs sm:text-sm">
              <span className="hidden sm:inline">
                {limit === null ? 'Ilimitado' : limit}
              </span>
              <span className="sm:hidden">
                {limit === null ? '∞' : limit}
              </span>
            </div>
          )
        },
        enableSorting: true
      },
      {
        accessorKey: 'currentUsageCount',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Usos'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const currentUsage = row.getValue('currentUsageCount') as number
          const usageLimit = row.original.usageLimit

          return (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-medium">{currentUsage}</span>
              {usageLimit && currentUsage >= usageLimit && (
                <Badge variant="destructive" className="text-xs">
                  <span className="hidden sm:inline">Límite alcanzado</span>
                  <span className="sm:hidden">Límite</span>
                </Badge>
              )}
            </div>
          )
        },
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
            <Badge variant={isActive ? 'success' : 'destructive'} className="text-xs">
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
          return (
            <div className="text-xs sm:text-sm text-gray-600">
              {date ? (
                <div className="break-words">
                  <div className="hidden sm:block">
                    {formatDateTime(new Date(date))}
                  </div>
                  <div className="sm:hidden">
                    {new Date(date).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                'N/A'
              )}
            </div>
          )
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
          return (
            <div className="text-xs sm:text-sm text-gray-600">
              {date ? (
                <div className="break-words">
                  <div className="hidden sm:block">
                    {formatDateTime(new Date(date))}
                  </div>
                  <div className="sm:hidden">
                    {new Date(date).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                'N/A'
              )}
            </div>
          )
        },
        enableSorting: true
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        cell: ({ row }) => {
          const currentUsage = row.original.currentUsageCount

          return (
            <div className='flex items-center justify-end gap-1 sm:gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                    <MoreHorizontal className='h-3 w-3 sm:h-4 sm:w-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <Pencil className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onViewHistory(row.original)}
                    disabled={currentUsage === 0}
                  >
                    <History className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
                    <span className="hidden sm:inline">Ver Historial ({currentUsage})</span>
                    <span className="sm:hidden">Historial ({currentUsage})</span>
                  </DropdownMenuItem>
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
    [onEdit, onDelete, onViewHistory]
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
