import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { Table } from '@tanstack/react-table'

import { Button } from '../../../../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table
}: DataTablePaginationProps<TData>) {
  return (
    <div className='flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between'>
      <div className='hidden sm:block flex-1 text-xs sm:text-sm text-muted-foreground'>
        {table.getFilteredSelectedRowModel().rows.length} de{' '}
        {table.getFilteredRowModel().rows.length} seleccionada(s).
      </div>
      <div className='flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 lg:gap-6'>
        <div className='flex items-center gap-2'>
          <p className='text-xs sm:text-sm font-medium'>
            <span className='hidden sm:inline'>Filas por página</span>
            <span className='sm:hidden'>Filas</span>
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-9 w-[70px] sm:h-8'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='text-xs sm:text-sm font-medium whitespace-nowrap'>
          <span className='sm:hidden'>
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
          </span>
          <span className='hidden sm:inline'>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>
        </div>
        <div className='flex items-center gap-1 sm:gap-2'>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Ir a primera página</span>
            <ChevronsLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='h-9 w-9 sm:h-8 sm:w-8 p-0'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Ir a página anterior</span>
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='h-9 w-9 sm:h-8 sm:w-8 p-0'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Ir a página siguiente</span>
            <ChevronRight className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='hidden h-8 w-8 p-0 lg:flex'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Ir a última página</span>
            <ChevronsRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
