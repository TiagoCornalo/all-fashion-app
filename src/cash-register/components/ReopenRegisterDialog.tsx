import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { LockOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea
} from '../../components'
import { reopenRegister } from '../../services/cash-register'

type Props = {
  registerId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const ReopenRegisterDialog = ({
  registerId,
  isOpen,
  onOpenChange,
  onSuccess
}: Props) => {
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => reopenRegister(registerId, reason),
    onSuccess: () => {
      toast.success('Caja reabierta')
      queryClient.invalidateQueries({ queryKey: ['cash-register'] })
      onSuccess?.()
      onOpenChange(false)
      setReason('')
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.details ||
          'Error al reabrir caja'
      )
    }
  })

  const submit = () => {
    if (!reason.trim()) {
      toast.error('El motivo es obligatorio')
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <LockOpen className='h-4 w-4 text-amber-600' />
            Reabrir caja
          </DialogTitle>
          <DialogDescription>
            Esta acción es solo para administradores y queda registrada con
            fecha, usuario y motivo. Usala únicamente para corregir errores
            descubiertos después del cierre.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Motivo de la reapertura <span className='text-red-600'>*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Ej. faltaba registrar una venta de transferencia que llegó tarde'
            className='min-h-[80px]'
          />
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Reabriendo...' : 'Reabrir caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReopenRegisterDialog
