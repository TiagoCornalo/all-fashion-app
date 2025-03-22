import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable
} from '../../../components'
import { Package, Eye, Pencil, Trash, MoreHorizontal } from 'lucide-react'
import { Product } from '../../../types/inventory.types'
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { formatCurrency } from '../../../utils'
import { DataTableColumnHeader } from '../../../components/shared/DataTableColumnHeader'
import { Badge } from '../../../components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../components'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { findProductsBySupplier } from '../../../services'

interface SupplierDetailProductsTableProps {
  supplierId: string
  onEditProduct?: (product: Product) => void
  onDeleteProduct?: (product: Product) => void
}

const SupplierDetailProductsTable = ({
  supplierId,
  onEditProduct,
  onDeleteProduct
}: SupplierDetailProductsTableProps) => {
  // Estados para la tabla
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  // Consultar productos usando React Query
  const {
    data: productsResponse,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [
      'supplierProducts',
      supplierId,
      pagination,
      sorting,
      filters,
      search
    ],
    queryFn: () =>
      findProductsBySupplier(supplierId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        ...filters
      }),
    enabled: !!supplierId
  })

  const products = productsResponse?.data || []
  const pageCount = productsResponse?.meta?.totalPages || 0

  const columns = useMemo<ColumnDef<Product>[]>(
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
        cell: ({ row }) => <span>{row.original.code}</span>,
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
        cell: ({ row }) => <span>{row.original.name}</span>,
        enableSorting: true
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Stock'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          const stock = row.original.stock
          const stockMinimum = row.original.stockMinimum

          let variant: 'destructive' | 'warning' | 'default' = 'default'

          if (stock <= stockMinimum) {
            variant = 'destructive'
          } else if (stock <= stockMinimum * 2) {
            variant = 'warning'
          }

          return (
            <div className='text-center'>
              <Badge variant={variant}>{stock}</Badge>
            </div>
          )
        },
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
        cell: ({ row }) => (
          <div className='text-right'>{formatCurrency(row.original.price)}</div>
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
              <Link to={`/inventory/${row.original._id}`}>
                <Button variant='outline' size='sm'>
                  <Eye className='h-4 w-4' />
                </Button>
              </Link>

              {(onEditProduct || onDeleteProduct) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {onEditProduct && (
                      <DropdownMenuItem
                        onClick={() => onEditProduct(row.original)}
                      >
                        <Pencil className='mr-2 h-4 w-4' />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onDeleteProduct && (
                      <DropdownMenuItem
                        onClick={() => onDeleteProduct(row.original)}
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
    [onEditProduct, onDeleteProduct]
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
    <Card className='w-full mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='h-6 w-6' />
          Productos del Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={products}
          pageCount={pageCount}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onRefresh={handleRefresh}
          initialPage={pagination.page - 1}
          initialPageSize={pagination.pageSize}
          isLoading={isLoading}
          emptyMessage='No hay productos para este proveedor'
          searchPlaceholder='Buscar producto...'
        />
      </CardContent>
    </Card>
  )
}

export default SupplierDetailProductsTable
