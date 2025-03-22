import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../components'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { deleteOrder } from '../../services/order'

interface DeleteOrderDialogProps {
  order: {
    _id: string
    supplier: {
      name: string
    }
  } | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onOrderDeleted: () => void
}

const DeleteOrderDialog = ({
  order,
  isOpen,
  onOpenChange,
  onOrderDeleted
}: DeleteOrderDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!order) return

    try {
      setIsDeleting(true)
      await deleteOrder(order._id)
      toast.success('Pedido eliminado exitosamente')
      onOrderDeleted()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || 'Error al eliminar el pedido'
        )
      } else {
        toast.error('Error al eliminar el pedido')
      }
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente el pedido para{' '}
            <span className='font-medium'>{order?.supplier.name}</span>. Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-red-600 hover:bg-red-700'
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteOrderDialog
