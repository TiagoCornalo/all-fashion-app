import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input
} from '../components'
import { Bank } from '../types/sale.types'
import { useCreateBank, useUpdateBank } from '../hooks/useBanks'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  bank?: Bank
}

const BankFormDialog = ({ isOpen, onOpenChange, mode, bank }: Props) => {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [debitPct, setDebitPct] = useState(0)
  const [creditPct, setCreditPct] = useState(0)
  const createMut = useCreateBank()
  const updateMut = useUpdateBank()

  useEffect(() => {
    if (isOpen) {
      setName(bank?.name ?? '')
      setNotes(bank?.notes ?? '')
      setDebitPct(bank?.surcharges?.DEBIT ?? 0)
      setCreditPct(bank?.surcharges?.CREDIT ?? 0)
    }
  }, [isOpen, bank])

  const isSubmitting = createMut.isPending || updateMut.isPending

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    const payload = {
      name: name.trim(),
      notes,
      surcharges: { DEBIT: Number(debitPct) || 0, CREDIT: Number(creditPct) || 0 }
    }
    try {
      if (mode === 'create') {
        await createMut.mutateAsync(payload)
        toast.success('Banco creado')
      } else if (bank) {
        await updateMut.mutateAsync({ id: bank._id, payload })
        toast.success('Banco actualizado')
      }
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al guardar')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo banco' : 'Editar banco'}
          </DialogTitle>
          <DialogDescription>
            El recargo se aplica al monto que el cliente paga con débito o crédito.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Nombre del banco</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ej. Galicia, Santander, BBVA...'
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-sm font-medium'>Recargo débito (%)</label>
              <Input
                type='number'
                step='0.1'
                min='0'
                max='100'
                value={debitPct}
                onChange={(e) => setDebitPct(Number(e.target.value))}
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Recargo crédito (%)</label>
              <Input
                type='number'
                step='0.1'
                min='0'
                max='100'
                value={creditPct}
                onChange={(e) => setCreditPct(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className='text-sm font-medium'>Notas internas (opcional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Ej. Banco principal del comercio'
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BankFormDialog
