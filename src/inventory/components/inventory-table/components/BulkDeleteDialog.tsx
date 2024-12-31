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
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación Masiva</DialogTitle>
          <DialogDescription>
            ¿Está seguro que desea eliminar {products.length} productos? Esta
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

export default BulkDeleteDialog
