import { Table } from '@tanstack/react-table'
import { X, Plus, RotateCcw } from 'lucide-react'
import { Product } from '../../../../types/inventory.types'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { DataTableViewOptions } from './DataTableViewOptions'

interface DataTableToolbarProps {
  table: Table<Product>
  onSearch: (value: string) => void
  onAdd?: () => void
  onBulkDelete: (products: Product[]) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export function DataTableToolbar({
  table,
  onAdd,
  onBulkDelete,
  onRefresh,
  isRefreshing = false
}: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getSelectedRowModel().rows

  return (
    <div className='space-y-3 sm:space-y-4'>
      {/* Primera fila: Búsqueda y botones principales en mobile, todo en una línea en desktop */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4'>
        {/* Búsqueda y filtros */}
        <div className='flex flex-col sm:flex-row sm:flex-1 sm:items-center gap-2 sm:space-x-2'>
          <Input
            placeholder='Buscar productos...'
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className='h-8 w-full sm:w-[200px] lg:w-[300px]'
          />
          {isFiltered && (
            <Button
              variant='ghost'
              onClick={() => table.resetColumnFilters()}
              className='h-8 px-2 lg:px-3 w-full sm:w-auto'
            >
              Resetear
              <X className='ml-2 h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Botones de acción */}
        <div className='flex flex-col sm:flex-row gap-2 sm:items-center sm:space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            disabled={isRefreshing}
            className='h-8 w-full sm:w-auto'
          >
            <RotateCcw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-0 mr-2`}
            />
            <span className='sm:hidden'>Actualizar</span>
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='h-8 w-full sm:w-auto'
            onClick={onAdd}
          >
            <Plus className='h-4 w-4 sm:mr-0 mr-2' />
            <span className='sm:hidden'>Agregar Producto</span>
            <span className='hidden sm:inline'>Agregar</span>
          </Button>
          <div className='hidden sm:block'>
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </div>

      {/* Segunda fila: Eliminar seleccionados y opciones de vista para mobile */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
        {selectedRows.length > 0 && (
          <Button
            variant='destructive'
            size='sm'
            onClick={() =>
              onBulkDelete(selectedRows.map((row) => row.original))
            }
            className='h-8 w-full sm:w-auto'
          >
            Eliminar ({selectedRows.length})
          </Button>
        )}
        <div className='sm:hidden'>
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </div>
  )
}
