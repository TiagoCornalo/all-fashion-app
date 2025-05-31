import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button
} from '../../../components'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface TransferConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (confirmed: boolean) => void
  customerPhone: string
  amount: number
}

/**
 * Modal de confirmación para verificar el envío del comprobante de transferencia
 * Permite al usuario confirmar si el comprobante fue enviado correctamente
 */
const TransferConfirmationModal = ({
  isOpen,
  onOpenChange,
  onConfirm,
  customerPhone,
  amount
}: TransferConfirmationModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false)

  /**
   * Maneja la confirmación del envío del comprobante
   * @param confirmed - true si el comprobante fue enviado, false si no
   */
  const handleConfirm = async (confirmed: boolean) => {
    setIsConfirming(true)
    try {
      await onConfirm(confirmed)
      onOpenChange(false)
    } catch (error) {
      console.error('Error confirming transfer receipt:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader className='flex flex-col items-center gap-2'>
          <AlertTriangle className='h-12 w-12 text-yellow-500' />
          <DialogTitle>Confirmación de Comprobante</DialogTitle>
        </DialogHeader>

        <DialogDescription className='text-center space-y-4'>
          <div className='p-4 bg-blue-50 rounded-md'>
            <div className='text-lg font-semibold text-blue-800'>
              Transferencia por: ${amount.toFixed(2)}
            </div>
            <div className='text-sm text-blue-600'>
              Teléfono del cliente: {customerPhone}
            </div>
          </div>
          <div className='text-sm text-muted-foreground'>
            <strong>¿El cliente ya envió el comprobante de transferencia al número de la tienda/administrador?</strong>
          </div>
          <div className='text-xs text-red-600'>
            * Debe confirmar que el comprobante fue enviado para continuar con la venta
          </div>
        </DialogDescription>

        <DialogFooter className='flex justify-between gap-2'>
          <Button
            type='button'
            variant='destructive'
            onClick={() => handleConfirm(false)}
            disabled={isConfirming}
            className='flex items-center gap-2'
          >
            <AlertTriangle className='h-4 w-4' />
            No, aún no enviado
          </Button>
          <Button
            type='button'
            onClick={() => handleConfirm(true)}
            disabled={isConfirming}
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
          >
            <CheckCircle className='h-4 w-4' />
            {isConfirming ? 'Confirmando...' : 'Sí, comprobante enviado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransferConfirmationModal