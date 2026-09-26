import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
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
import { LabelPrintDialog } from '../LabelPrintDialog'
import { StockReceiptDialog } from '../StockReceiptDialog'
import { BarcodeManagerDialog } from '../BarcodeManagerDialog'
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner'

interface DataTableProps {
  columns: (handlers: {
    onEdit: (product: Product) => void
    onDelete: (product: Product) => void
    onBarcodes: (product: Product) => void
    onPrintLabel: (product: Product) => void
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
  canManageProducts?: boolean
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
  initialPageSize,
  canManageProducts = true
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
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isLabelPrintOpen, setIsLabelPrintOpen] = useState(false)
  const [singleLabelProduct, setSingleLabelProduct] = useState(false)
  const [isBarcodeManagerOpen, setIsBarcodeManagerOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const onFilterChangeRef = useRef(onFilterChange)
  const filtersMountedRef = useRef(false)

  useEffect(() => {
    onFilterChangeRef.current = onFilterChange
  }, [onFilterChange])

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
        },
        onBarcodes: (product) => {
          setSelectedProduct(product)
          setIsBarcodeManagerOpen(true)
        },
        onPrintLabel: (product) => {
          setSingleLabelProduct(true)
          setSelectedProducts([product])
          setIsLabelPrintOpen(true)
        }
      }),
    [columns]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId: (row) => row._id,
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

  // El lector escribe carácter por carácter antes de enviar Enter. Esperar a
  // que termine evita consultar y repintar la tabla por cada prefijo leído.
  useEffect(() => {
    if (!filtersMountedRef.current) {
      filtersMountedRef.current = true
      return
    }

    const timeout = window.setTimeout(() => {
      const filterObject = columnFilters.reduce(
        (acc, filter) => ({
          ...acc,
          [filter.id]: filter.value as string
        }),
        {} as Record<string, string>
      )
      onFilterChangeRef.current(filterObject)
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [columnFilters])

  useBarcodeScanner({
    enabled: !isReceiptOpen && !isLabelPrintOpen && !isBarcodeManagerOpen && !isAddOpen && !isEditOpen && !isDeleteOpen && !isBulkDeleteOpen,
    onScan: (value) => {
      table.getColumn('name')?.setFilterValue(value)
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
          onReceiveStock={() => setIsReceiptOpen(true)}
          onPrintLabels={(products) => {
            setSingleLabelProduct(false)
            setSelectedProducts(products)
            setIsLabelPrintOpen(true)
          }}
          canManageProducts={canManageProducts}
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
                      Number(row.original.stock || 0) <= Number(row.original.stockMinimum || 0)
                        ? 'bg-red-200 hover:bg-red-300'
                        : Number(row.original.stock || 0) <= Number(row.original.stockMinimum || 0) * 1.2
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
                    colSpan={tableColumns.length}
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

      {canManageProducts && (
        <AddProductDialog
          isOpen={isAddOpen}
          onOpenChange={setIsAddOpen}
          onCreated={(product) => {
            setSingleLabelProduct(true)
            setSelectedProducts([product])
            setIsLabelPrintOpen(true)
          }}
        />
      )}

      <StockReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        onCompleted={onRefresh}
      />

      <LabelPrintDialog
        singleProduct={singleLabelProduct}
        open={isLabelPrintOpen}
        onOpenChange={setIsLabelPrintOpen}
        products={selectedProducts}
      />

      <BarcodeManagerDialog
        open={isBarcodeManagerOpen}
        onOpenChange={setIsBarcodeManagerOpen}
        product={selectedProduct}
        onUpdated={onRefresh}
      />
    </>
  )
}

export default DataTable
