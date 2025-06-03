import { useInventory } from '../../../context/InventoryContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button
} from '../../../../components'
import { Product } from '../../../../types/inventory.types'
import { bulkDeleteProducts } from '../../../../services'
import { toast } from 'react-toastify'

interface BulkDeleteDialogProps {
  products: Product[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const BulkDeleteDialog = ({
  products,
  isOpen,
  onOpenChange,
  onSuccess
}: BulkDeleteDialogProps) => {
  const { refreshTable } = useInventory()

  const handleDelete = async () => {
    try {
      await bulkDeleteProducts(products.map((product) => product._id))
      onOpenChange(false)
      refreshTable()
      onSuccess?.()
      toast.success('Productos eliminados correctamente')
    } catch (error) {
      console.error('Error al eliminar productos:', error)
      toast.error('Error al eliminar productos')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-sm sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Confirmar Eliminación Masiva</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            ¿Está seguro que desea eliminar <span className='font-semibold'>{products.length} productos</span>? Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='w-full sm:w-auto h-9 sm:h-10'
          >
            Cancelar
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            className='w-full sm:w-auto h-9 sm:h-10'
          >
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BulkDeleteDialog
