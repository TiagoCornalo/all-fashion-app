import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button
} from '../../components'
import { Discount } from '../../types/discount.types'
import { toast } from 'react-toastify'
import { AlertTriangle } from 'lucide-react'
import { updateDiscount } from '../../services/discounts'

interface DeleteDiscountDialogProps {
  discount: Discount | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDiscountDeleted: () => Promise<void>
}

const DeleteDiscountDialog = ({
  discount,
  isOpen,
  onOpenChange,
  onDiscountDeleted
}: DeleteDiscountDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!discount) return

    setIsDeleting(true)
    try {
      // La API realiza un soft delete (cambia isActive a false)
      await updateDiscount(discount._id, { ...discount, isActive: false })
      toast.success('Descuento desactivado correctamente')
      onOpenChange(false)
      await onDiscountDeleted()
    } catch (error) {
      console.error('Error al desactivar descuento:', error)
      toast.error('Error al desactivar el descuento')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader className='flex flex-col items-center gap-2'>
          <AlertTriangle className='h-12 w-12 text-yellow-500' />
          <DialogTitle>Desactivar Descuento</DialogTitle>
        </DialogHeader>

        <DialogDescription className='text-center'>
          ¿Estás seguro de que deseas desactivar el descuento{' '}
          <strong>{discount?.code}</strong>?
          <br />
          Esta acción desactivará el descuento y no podrá ser utilizado en
          nuevas ventas.
        </DialogDescription>

        <DialogFooter className='flex justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteDiscountDialog
