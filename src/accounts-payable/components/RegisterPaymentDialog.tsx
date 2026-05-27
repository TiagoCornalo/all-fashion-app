import { useState } from 'react'
import { toast } from 'react-toastify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input
} from '../../components'
import {
  accountsPayableService,
  AccountPayable
} from '../../services/accountsPayable.service'

type Props = {
  account: AccountPayable
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const METHODS: Array<{ value: string; label: string }> = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DEBIT', label: 'Débito' },
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'CHECK', label: 'Cheque' },
  { value: 'MP', label: 'Mercado Pago' }
]

const RegisterPaymentDialog = ({ account, isOpen, onOpenChange, onSuccess }: Props) => {
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('CASH')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [sendWhatsApp, setSendWhatsApp] = useState(true)
  const queryClient = useQueryClient()

  const submit = useMutation({
    mutationFn: async () => {
      const numericAmount = Number(amount)
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Ingresá un monto válido mayor a cero')
      }
      return accountsPayableService.registerPaymentToAccount(account._id, {
        amount: numericAmount,
        method,
        reference,
        notes
      })
    },
    onSuccess: async (result) => {
      toast.success(`Pago de $${result.paidAmount.toFixed(2)} registrado`)
      queryClient.invalidateQueries({ queryKey: ['account-detail', account._id] })
      onSuccess?.()

      if (sendWhatsApp) {
        try {
          const wa = await accountsPayableService.getWhatsAppForBalance(account._id)
          window.open(wa.url, '_blank', 'noopener,noreferrer')
        } catch (err) {
          console.error('Error abriendo WhatsApp:', err)
          toast.warn('Pago registrado, pero no se pudo armar el mensaje de WhatsApp')
        }
      }

      onOpenChange(false)
      reset()
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Error al registrar pago'
      toast.error(message)
    }
  })

  const reset = () => {
    setAmount('')
    setMethod('CASH')
    setReference('')
    setNotes('')
  }

  const handleClose = (next: boolean) => {
    if (submit.isPending) return
    onOpenChange(next)
    if (!next) reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Registrar pago de {account.customer.name}</DialogTitle>
          <DialogDescription>
            El pago se asigna a la cuota más antigua pendiente. Saldo actual:{' '}
            <strong>${account.currentBalance.toLocaleString('es-AR')}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div>
            <label className='text-sm font-medium'>Monto recibido</label>
            <Input
              type='number'
              step='0.01'
              min='0'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder='0,00'
            />
          </div>

          <div>
            <label className='text-sm font-medium'>Método</label>
            <select
              className='w-full rounded-md border bg-background px-2 py-2 text-sm'
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='text-sm font-medium'>Referencia (opcional)</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder='Número de comprobante, transferencia, cheque...'
            />
          </div>

          <div>
            <label className='text-sm font-medium'>Notas internas (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Observaciones'
            />
          </div>

          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
            />
            <Send className='h-3.5 w-3.5' />
            Enviar saldo actualizado al cliente por WhatsApp después de registrar
          </label>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleClose(false)} disabled={submit.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? 'Registrando...' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentDialog
