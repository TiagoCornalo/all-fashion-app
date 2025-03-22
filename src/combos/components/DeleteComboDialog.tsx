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
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader className='flex flex-col items-center gap-2'>
          <AlertTriangle className='h-12 w-12 text-yellow-500' />
          <DialogTitle>Desactivar Combo</DialogTitle>
        </DialogHeader>

        <DialogDescription className='text-center'>
          ¿Estás seguro de que deseas desactivar el combo{' '}
          <strong>{combo?.name}</strong>?
          <br />
          Este combo no estará disponible para nuevas ventas.
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

export default DeleteComboDialog
