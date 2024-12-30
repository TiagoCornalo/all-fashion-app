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
  const handleDelete = async () => {
    if (!product) return

    await deleteProduct(product._id)
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Está seguro que desea eliminar el producto {product?.name}? Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant='destructive' onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteProductDialog
