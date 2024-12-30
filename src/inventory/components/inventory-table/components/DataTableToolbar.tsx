import { Table } from '@tanstack/react-table'
import { X, Plus } from 'lucide-react'
import { Product } from '../../../../types/inventory.types'

import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { DataTableViewOptions } from './DataTableViewOptions'

interface DataTableToolbarProps {
  table: Table<Product>
  onSearch: (value: string) => void
  onAdd?: () => void
  onBulkDelete: (products: Product[]) => void
}

export function DataTableToolbar({ table, onSearch, onAdd, onBulkDelete }: DataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getSelectedRowModel().rows

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Buscar productos...'
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Resetear
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}
        {selectedRows.length > 0 && (
          <Button
            variant='destructive'
            size='sm'
            onClick={() => onBulkDelete(selectedRows.map(row => row.original))}
            className='h-8'
          >
            Eliminar ({selectedRows.length})
          </Button>
        )}
      </div>
      <div className='flex items-center space-x-2'>
        <Button variant='outline' size='sm' className='h-8' onClick={onAdd}>
          <Plus className='mr-2 h-4 w-4' />
          Agregar Producto
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
