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
import { deleteProduct } from '../../../../services'
import { toast } from 'react-toastify'

interface DeleteProductDialogProps {
  product: Product | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteProductDialog = ({
  product,
  isOpen,
  onOpenChange
}: DeleteProductDialogProps) => {
  const { refreshTable } = useInventory()

  const handleDelete = async () => {
    if (!product) return

    try {
      await deleteProduct(product._id)
      onOpenChange(false)
      refreshTable()
      toast.success('Producto eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar el producto:', error)
      toast.error('Error al eliminar el producto')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-sm sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Confirmar Eliminación</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            ¿Está seguro que desea eliminar el producto <span className='font-semibold'>{product?.name}</span>? Esta
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

export default DeleteProductDialog
