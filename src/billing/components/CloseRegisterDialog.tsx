import { useState } from 'react'
import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Textarea,

} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import { getPendingTransfers } from '../../services/transferVerification'
import PendingTransfersPanel from '../../components/transfers/PendingTransfersPanel'
import { AlertTriangle } from 'lucide-react'

const formSchema = z.object({
  actualCash: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  notes: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface CloseRegisterDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const CloseRegisterDialog = ({
  isOpen,
  onOpenChange
}: CloseRegisterDialogProps) => {
  const { currentRegister, closeRegister } = useCashRegisterStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPendingTransfers, setShowPendingTransfers] = useState(false)

  // Query para verificar transferencias pendientes
  const { data: pendingTransfers } = useQuery({
    queryKey: ['pending-transfers-close'],
    queryFn: () => getPendingTransfers({ pageSize: 10 }),
    enabled: isOpen // Solo ejecutar cuando el modal esté abierto
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualCash: currentRegister?.currentBalance || 0,
      notes: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!currentRegister) return

    // Verificar si hay transferencias pendientes
    if (pendingTransfers?.data && pendingTransfers.data.length > 0) {
      toast.warning(
        `Hay ${pendingTransfers.data.length} transferencia(s) pendiente(s) de verificación. Se recomienda verificarlas antes de cerrar la caja.`
      )
    }

    try {
      setIsSubmitting(true)
      await closeRegister(currentRegister._id, values.actualCash, values.notes)
      toast.success('Caja cerrada correctamente')
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Error al cerrar la caja')
    } finally {
      setIsSubmitting(false)
      window.location.reload()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Cerrar Caja</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Ingrese el monto final y las notas para cerrar la caja
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de transferencias pendientes */}
        {pendingTransfers?.data && pendingTransfers.data.length > 0 && (
          <div className='border border-yellow-200 bg-yellow-50 p-3 sm:p-4 rounded-md'>
            <div className='flex flex-col sm:flex-row sm:items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 mt-0.5 mx-auto sm:mx-0' />
              <div className='flex-1 text-center sm:text-left'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                  <span className='text-yellow-800 text-sm'>
                    Hay <strong>{pendingTransfers.data.length}</strong> transferencia(s) pendiente(s) de verificación.
                  </span>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowPendingTransfers(true)}
                    className='w-full sm:w-auto'
                  >
                    Ver Transferencias
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='actualCash'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Monto Final</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      className='h-9 sm:h-10'
                      onChange={(e) => {
                        const value =
                          e.target.value === '' ? '' : Number(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Notas adicionales...'
                      className='min-h-[80px] sm:min-h-[100px]'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='w-full sm:w-auto h-9 sm:h-10'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='w-full sm:w-auto h-9 sm:h-10'
              >
                {isSubmitting ? 'Cerrando...' : 'Cerrar Caja'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      {/* Modal de transferencias pendientes */}
      <Dialog open={showPendingTransfers} onOpenChange={setShowPendingTransfers}>
        <DialogContent className='w-[95vw] max-w-6xl max-h-[80vh] overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              Transferencias Pendientes de Verificación
            </DialogTitle>
          </DialogHeader>
          <div className='overflow-auto'>
            <PendingTransfersPanel showAsDialog={false} maxHeight='60vh' />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export default CloseRegisterDialog
