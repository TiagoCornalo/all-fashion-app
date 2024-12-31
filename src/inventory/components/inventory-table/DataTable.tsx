import { useState, useMemo, useCallback } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table'

import { DataTablePagination } from './components/DataTablePagination'
import { DataTableToolbar } from './components/DataTableToolbar'
import DeleteProductDialog from './components/DeleteProductDialog'
import EditProductDialog from './components/EditProductDialog'
import { Product } from '../../../types/inventory.types'
import BulkDeleteDialog from './components/BulkDeleteDialog'
import AddProductDialog from './components/AddProductDialog'

interface DataTableProps {
  columns: (handlers: {
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void
  }) => ColumnDef<Product, unknown>[]
  data: Product[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onFilterChange: (filters: Record<string, string>) => void
  onSearchChange: (search: string) => void
  onRefresh: () => Promise<void>
  initialPage: number
  initialPageSize: number
}

export function DataTable({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  onSearchChange,
  onRefresh,
  initialPage,
  initialPageSize
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tableColumns = useMemo(
    () =>
      columns({
        onEdit: (product) => {
          setSelectedProduct(product)
          setIsEditOpen(true)
        },
        onDelete: (product) => {
          setSelectedProduct(product)
          setIsDeleteOpen(true)
        }
      }),
    [columns]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: pageCount,
    state: {
      pagination: {
        pageIndex: initialPage,
        pageSize: initialPageSize
      },
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
      if (newSorting.length > 0) {
        onSortingChange(newSorting[0].id, newSorting[0].desc ? 'desc' : 'asc')
      }
    },
    onColumnFiltersChange: (updater) => {
      const newFilters =
        typeof updater === 'function' ? updater(columnFilters) : updater
      setColumnFilters(newFilters)
      const filterObject = newFilters.reduce(
        (acc, filter) => ({
          ...acc,
          [filter.id]: filter.value as string
        }),
        {} as Record<string, string>
      )
      onFilterChange(filterObject)
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange: (updater) => {
      const state = table.getState().pagination
      const newState = typeof updater === 'function' ? updater(state) : updater

      onPaginationChange(newState.pageIndex + 1, newState.pageSize)
    }
  })

  // Manejar cambios en la búsqueda
  const handleSearch = useCallback(
    (value: string) => {
      onSearchChange(value)
    },
    [onSearchChange]
  )

  const handleBulkDeleteClick = (products: Product[]) => {
    setSelectedProducts(products)
    setIsBulkDeleteOpen(true)
  }

  const handleBulkDeleteSuccess = () => {
    setRowSelection({})
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  return (
    <>
      <div className='space-y-4'>
        <DataTableToolbar
          table={table}
          onSearch={handleSearch}
          onBulkDelete={handleBulkDeleteClick}
          onAdd={() => setIsAddOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={
                      row.original.stock <= row.original.stockMinimum
                        ? 'bg-red-200 hover:bg-red-300'
                        : row.original.stock <= row.original.stockMinimum * 2
                        ? 'bg-yellow-200 hover:bg-yellow-300'
                        : ''
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='h-24 text-center'
                  >
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      <EditProductDialog
        product={selectedProduct}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <DeleteProductDialog
        product={selectedProduct}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />

      <BulkDeleteDialog
        products={selectedProducts}
        isOpen={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        onSuccess={handleBulkDeleteSuccess}
      />

      <AddProductDialog isOpen={isAddOpen} onOpenChange={setIsAddOpen} />
    </>
  )
}

export default DataTable
