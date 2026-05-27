import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components'
import { Eye, Ellipsis, Pencil, Trash } from 'lucide-react'
import { Briefcase } from '../../assets'
import { Supplier } from '../../types/inventory.types'
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '../../utils'
import { Link } from 'react-router-dom'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'

interface SuppliersTableProps {
  suppliers: Supplier[] | undefined
  isLoading: boolean
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (value: string) => void
  onFilterChange: (newFilters: Record<string, string>) => void
  onRefresh: () => Promise<void>
  initialPage: number
  initialPageSize: number
  onEdit?: (supplier: Supplier) => void
  onDelete?: (supplier: Supplier) => void
}

const SuppliersTable = ({
  suppliers,
  isLoading,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  onFilterChange,
  onRefresh,
  initialPage,
  initialPageSize,
  onEdit,
  onDelete
}: SuppliersTableProps) => {
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Nombre'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span>{row.original.name}</span>
            {row.original.isPlaceholder && (
              <span className='inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700'>
                Sin completar
              </span>
            )}
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'contact.email',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Email'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <span className={row.original.contact?.email ? '' : 'text-muted-foreground'}>
            {row.original.contact?.email || '—'}
          </span>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'contact.phone',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Teléfono'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <span className={row.original.contact?.phone ? '' : 'text-muted-foreground'}>
            {row.original.contact?.phone || '—'}
          </span>
        ),
        enableSorting: true
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Fecha de Creación'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => (
          <span>{formatDateTime(new Date(row.original.createdAt || ''))}</span>
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
              <Link to={`/suppliers/${row.original._id}`}>
                <Button variant='outline' size='sm'>
                  <Eye className='h-4 w-4' />
                </Button>
              </Link>

              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <Ellipsis className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(row.original)}>
                        <Pencil className='mr-2 h-4 w-4' />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(row.original)}
                        className='text-red-600'
                      >
                        <Trash className='mr-2 h-4 w-4' />
                        Eliminar
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
    [onEdit, onDelete]
  )

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {/* @ts-ignore */}
          <Briefcase className='h-6 w-6' />
          Listado de Proveedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={suppliers || []}
          pageCount={pageCount}
          onPaginationChange={onPaginationChange}
          onSortingChange={onSortingChange}
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
          onRefresh={onRefresh}
          initialPage={initialPage}
          initialPageSize={initialPageSize}
          isLoading={isLoading}
          emptyMessage='No hay proveedores registrados'
          searchPlaceholder='Buscar proveedor...'
        />
      </CardContent>
    </Card>
  )
}

export default SuppliersTable
