import { useState, useCallback } from 'react'
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
  TableRow,
  Input,
  Button
} from '..'
import DataTablePagination from './DataTablePagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onFilterChange: (filters: Record<string, string>) => void
  onSearchChange?: (search: string) => void
  onRefresh: () => Promise<void>
  initialPage: number
  initialPageSize: number
  showToolbar?: boolean
  showSearch?: boolean
  showPagination?: boolean
  searchPlaceholder?: string
  refreshButtonText?: string
  emptyMessage?: string
  loadingMessage?: string
  errorMessage?: string
  isLoading?: boolean
  error?: string | null
}

export function DataTable<TData, TValue>({
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
  showToolbar = true,
  showSearch = true,
  showPagination = true,
  searchPlaceholder = 'Buscar...',
  refreshButtonText = 'Actualizar',
  emptyMessage = 'No hay resultados.',
  loadingMessage = 'Cargando...',
  errorMessage = 'Error al cargar los datos. Inténtalo de nuevo.',
  isLoading = false,
  error = null
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tableColumns = columns

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

  const handleSearch = useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value)
      }
    },
    [onSearchChange]
  )

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh()
    setIsRefreshing(false)
  }

  return (
    <div className='space-y-4'>
      {showToolbar && (
        <div className='flex items-center justify-between'>
          {showSearch && onSearchChange && (
            <div className='flex w-full max-w-sm items-center space-x-2'>
              <Input
                placeholder={searchPlaceholder}
                onChange={(e) => handleSearch(e.target.value)}
                className='h-8'
              />
            </div>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? loadingMessage : refreshButtonText}
          </Button>
        </div>
      )}

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
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
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
                  {isLoading
                    ? loadingMessage
                    : error
                    ? errorMessage
                    : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <DataTablePagination
          currentPage={initialPage}
          totalPages={pageCount}
          onPageChange={(page) => onPaginationChange(page, initialPageSize)}
        />
      )}
    </div>
  )
}

export default DataTable
