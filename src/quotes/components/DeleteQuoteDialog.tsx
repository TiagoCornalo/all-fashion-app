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
import { Quote } from '../../types/quote.types'
import { toast } from 'react-toastify'
import { AlertTriangle } from 'lucide-react'
import { deleteQuote } from '../../services/quote.service'

interface DeleteQuoteDialogProps {
  quote: Quote | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onQuoteDeleted: () => Promise<void>
}

const DeleteQuoteDialog = ({
  quote,
  isOpen,
  onOpenChange,
  onQuoteDeleted
}: DeleteQuoteDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!quote?._id) return

    setIsDeleting(true)
    try {
      await deleteQuote(quote._id)
      toast.success('Remito eliminado correctamente')
      onOpenChange(false)
      await onQuoteDeleted()
    } catch (error) {
      console.error('Error al eliminar remito:', error)
      toast.error('Error al eliminar el remito')
    } finally {
      setIsDeleting(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      'QUOTE': 'Presupuesto',
      'ESTIMATE': 'Cotización',
      'INVOICE': 'Factura'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-md sm:max-w-lg'>
        <DialogHeader className='flex flex-col items-center gap-2 sm:gap-3 text-center'>
          <AlertTriangle className='h-10 w-10 sm:h-12 sm:w-12 text-yellow-500' />
          <DialogTitle className="text-base sm:text-lg">Eliminar Remito</DialogTitle>
        </DialogHeader>

        <DialogDescription className='text-center text-xs sm:text-sm text-gray-600 break-words'>
          ¿Estás seguro de que deseas eliminar el{' '}
          <strong className="break-all">
            {quote ? getTypeLabel(quote.type) : 'documento'} N° {quote?.number}
          </strong>
          {quote?.customer && (
            <>
              <br />
              de <strong className="break-words">{quote.customer.name}</strong>
            </>
          )}
          ?
          <br />
          <br />
          Esta acción no se puede deshacer.
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
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteQuoteDialog