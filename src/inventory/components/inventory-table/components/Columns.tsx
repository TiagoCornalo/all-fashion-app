import { ColumnDef } from '@tanstack/react-table'
import { Product } from '../../../../types/inventory.types'
import { DataTableColumnHeader } from './DataTableColumnHeader'
import { DataTableRowActions } from './DataTableRowActions'
import { formatCurrency, formatDateTime } from '../../../../utils'
import { Badge, Checkbox } from '../../../../components'

export const columns = (handlers: {
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}): ColumnDef<Product>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Seleccionar todo'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Seleccionar fila'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Código' />
    ),
    cell: ({ row }) => <div className='font-medium'>{row.getValue('code')}</div>
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre' />
    ),
    cell: ({ row }) => <div>{row.getValue('name')}</div>
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Stock' />
    ),
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number
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
    }
  },
  {
    accessorKey: 'price',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Precio' />
    ),
    cell: ({ row }) => (
      <div className='text-right'>{formatCurrency(row.getValue('price'))}</div>
    )
  },
  {
    id: 'proveedor',
    accessorFn: (row) => row.supplier.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Proveedor' />
    ),
    cell: ({ row }) => <div>{row.getValue('proveedor')}</div>,
    enableSorting: true,
    enableHiding: true
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Última actualización' />
    ),
    cell: ({ row }) => (
      <div>{formatDateTime(new Date(row.getValue('updatedAt')))}</div>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onEdit={handlers.onEdit}
        onDelete={handlers.onDelete}
      />
    )
  }
]
