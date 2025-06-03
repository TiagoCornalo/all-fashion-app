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
import { ProductCombo } from '../../types/combos.types'
import { toast } from 'react-toastify'
import { AlertTriangle } from 'lucide-react'
import { deleteCombo } from '../../services/combos'

interface DeleteComboDialogProps {
  combo: ProductCombo | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComboDeleted: () => Promise<void>
}

const DeleteComboDialog = ({
  combo,
  isOpen,
  onOpenChange,
  onComboDeleted
}: DeleteComboDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!combo) return

    setIsDeleting(true)
    try {
      await deleteCombo(combo._id)
      toast.success('Combo desactivado correctamente')
      onOpenChange(false)
      await onComboDeleted()
    } catch (error) {
      console.error('Error al desactivar combo:', error)
      toast.error('Error al desactivar el combo')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-md sm:max-w-lg'>
        <DialogHeader className='flex flex-col items-center gap-2 sm:gap-3 text-center'>
          <AlertTriangle className='h-10 w-10 sm:h-12 sm:w-12 text-yellow-500' />
          <DialogTitle className="text-base sm:text-lg">Desactivar Combo</DialogTitle>
        </DialogHeader>

        <DialogDescription className='text-center text-xs sm:text-sm text-gray-600 break-words'>
          ¿Estás seguro de que deseas desactivar el combo{' '}
          <strong className="break-all">{combo?.name}</strong>?
          <br />
          <br />
          Este combo no estará disponible para nuevas ventas.
        </DialogDescription>

        <DialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto text-xs sm:text-sm order-2 sm:order-1"
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto text-xs sm:text-sm order-1 sm:order-2"
            size="sm"
          >
            {isDeleting ? 'Desactivando...' : 'Desactivar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteComboDialog
