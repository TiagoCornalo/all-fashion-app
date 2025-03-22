import { useMemo } from 'react'
import { DataTable } from '../../components'
import { ColumnDef } from '@tanstack/react-table'
import { ProductCombo } from '../../types/combos.types'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components'
import { formatCurrency } from '../../utils'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'

interface CombosTableProps {
  combos: ProductCombo[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (search: string) => void
  onRefresh: () => Promise<void>
  onEdit: (combo: ProductCombo) => void
  onDelete: (combo: ProductCombo) => void
  isLoading: boolean
  initialPage: number
  initialPageSize: number
}

const CombosTable = ({
  combos,
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
}: CombosTableProps) => {
  const columns = useMemo<ColumnDef<ProductCombo>[]>(
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
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Nombre'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
        enableSorting: true
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Precio'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => <div>{formatCurrency(row.getValue('price'))}</div>,
        enableSorting: true
      },
      {
        id: 'products',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Productos'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const items = row.original.items || []
          return <div>{items.length} productos</div>
        }
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
    // No se implementa para este caso
  }

  return (
    <DataTable
      columns={columns}
      data={combos}
      pageCount={pageCount}
      onPaginationChange={onPaginationChange}
      onSortingChange={onSortingChange}
      onFilterChange={handleFilterChange}
      onSearchChange={onSearchChange}
      onRefresh={onRefresh}
      initialPage={initialPage}
      initialPageSize={initialPageSize}
      isLoading={isLoading}
      searchPlaceholder='Buscar combos...'
      emptyMessage='No hay combos disponibles'
    />
  )
}

export default CombosTable
