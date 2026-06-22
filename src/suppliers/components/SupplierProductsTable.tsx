import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable
} from '../../components'
import { Plus, Package } from 'lucide-react'
import { Product } from '../../types/inventory.types'
import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { formatCurrency } from '../../utils'
import { DataTableColumnHeader } from '../../components/shared/DataTableColumnHeader'
import { Badge } from '../../components/ui/badge'

interface SupplierProductsTableProps {
  products: Product[] | undefined
  isLoading: boolean
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onSearchChange: (value: string) => void
  onFilterChange: (newFilters: Record<string, string>) => void
  onRefresh: () => Promise<void>
  initialPage: number
  initialPageSize: number
  onAddProduct: (product: Product) => void
  selectedProductIds: string[]
}

const SupplierProductsTable = ({
  products,
  isLoading,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
  onFilterChange,
  onRefresh,
  initialPage,
  initialPageSize,
  onAddProduct,
  selectedProductIds
}: SupplierProductsTableProps) => {
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
        accessorKey: 'basePrice',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title='Costo base'
            showHideButton={false}
          />
        ),
        cell: ({ row }) => {
          if (row.original.basePrice === undefined || row.original.basePrice === null) {
            return <div className='text-right text-muted-foreground'>No disponible</div>
          }
          return (
            <div className='text-right'>
              {row.original.baseCurrency === 'USD'
                ? `USD ${row.original.basePrice.toLocaleString('es-AR')}`
                : formatCurrency(row.original.basePrice)}
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
          const isSelected = selectedProductIds.includes(row.original._id)

          return (
            <div className='flex items-center justify-end'>
              <Button
                variant={isSelected ? 'default' : 'outline'}
                size='sm'
                onClick={() => onAddProduct(row.original)}
                disabled={isSelected}
              >
                <Plus className='h-4 w-4 mr-1' />
                {isSelected ? 'Agregado' : 'Agregar'}
              </Button>
            </div>
          )
        }
      }
    ],
    [onAddProduct, selectedProductIds]
  )

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='h-6 w-6' />
          Productos del Proveedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={products || []}
          pageCount={pageCount}
          onPaginationChange={onPaginationChange}
          onSortingChange={onSortingChange}
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
          onRefresh={onRefresh}
          initialPage={initialPage}
          initialPageSize={initialPageSize}
          isLoading={isLoading}
          emptyMessage='No hay productos para este proveedor'
          searchPlaceholder='Buscar producto...'
        />
      </CardContent>
    </Card>
  )
}

export default SupplierProductsTable
