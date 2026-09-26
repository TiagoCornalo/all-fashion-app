import { Row } from '@tanstack/react-table'
import { Barcode, MoreHorizontal, Pencil, Printer, Trash } from 'lucide-react'
import { Product } from '../../../../types/inventory.types'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../../components/ui/dropdown-menu'
import { Button } from '../../../../components/ui/button'

interface DataTableRowActionsProps {
  row: Row<Product>
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onBarcodes: (product: Product) => void
  onPrintLabel: (product: Product) => void
  canManageProducts?: boolean
}

export function DataTableRowActions({
  row,
  onEdit,
  onDelete,
  onBarcodes,
  onPrintLabel,
  canManageProducts = true
}: DataTableRowActionsProps) {
  const product = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[200px]'>
        {canManageProducts && (
          <DropdownMenuItem onClick={() => onEdit(product)}>
            <Pencil className='mr-2 h-4 w-4' />
            Editar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onBarcodes(product)}>
          <Barcode className='mr-2 h-4 w-4' />
          Códigos y stock
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPrintLabel(product)}>
          <Printer className='mr-2 h-4 w-4' />
          Imprimir etiqueta
        </DropdownMenuItem>
        {canManageProducts && (
          <DropdownMenuItem
            onClick={() => onDelete(product)}
            className='text-red-600'
          >
            <Trash className='mr-2 h-4 w-4' />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
