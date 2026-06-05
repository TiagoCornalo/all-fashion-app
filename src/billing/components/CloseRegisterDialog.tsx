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
  Loader
} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-toastify'
import { useQuery } from '@tanstack/react-query'
import { getPendingTransfers } from '../../services/transferVerification'
import {
  getReconciliation,
  ReconciliationResponse
} from '../../services/cash-register'
import PendingTransfersPanel from '../../components/transfers/PendingTransfersPanel'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/auth/useAuth'

const formSchema = z.object({
  actualCash: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  notes: z.string().optional(),
  discrepancyNote: z.string().optional(),
  forceClose: z.boolean().optional()
})

type FormValues = z.infer<typeof formSchema>

interface CloseRegisterDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Efectivo',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  TRANSFER: 'Transferencia',
  MP: 'Mercado Pago',
  ACCOUNT_PAYABLE: 'Cuenta corriente'
}

const formatArs = (n: number) =>
  n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const CloseRegisterDialog = ({
  isOpen,
  onOpenChange
}: CloseRegisterDialogProps) => {
  const { currentRegister, closeRegister } = useCashRegisterStore()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPendingTransfers, setShowPendingTransfers] = useState(false)
  const canSeeTransfers = ['ADMIN', 'MANAGER', 'SELLER'].includes(user?.role || '')

  // Reconciliación contra historial real
  const {
    data: reconciliation,
    isLoading: reconciliationLoading,
    refetch: refetchReconciliation
  } = useQuery<ReconciliationResponse>({
    queryKey: ['reconciliation', currentRegister?._id],
    queryFn: () => getReconciliation(currentRegister!._id),
    enabled: isOpen && !!currentRegister?._id
  })

  // Transferencias pendientes (aviso adicional)
  const { data: pendingTransfers } = useQuery({
    queryKey: ['pending-transfers-close'],
    queryFn: () => getPendingTransfers({ pageSize: 10 }),
    enabled: isOpen && canSeeTransfers
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualCash: currentRegister?.currentBalance || 0,
      notes: '',
      discrepancyNote: '',
      forceClose: false
    }
  })

  const hasDiscrepancy = reconciliation?.hasDiscrepancy ?? false

  const onSubmit = async (values: FormValues) => {
    if (!currentRegister) return

    // Si hay discrepancia, exigir nota
    if (hasDiscrepancy && (!values.discrepancyNote || !values.discrepancyNote.trim())) {
      toast.error(
        'Hay discrepancias entre la caja y el historial. Escribí una nota explicando antes de forzar el cierre.'
      )
      return
    }

    try {
      setIsSubmitting(true)
      await closeRegister(currentRegister._id, {
        actualCash: values.actualCash,
        notes: values.notes,
        forceClose: hasDiscrepancy,
        discrepancyNote: hasDiscrepancy ? values.discrepancyNote : undefined
      })
      toast.success(
        hasDiscrepancy
          ? 'Caja cerrada con discrepancia registrada'
          : 'Caja cerrada correctamente'
      )
      onOpenChange(false)
    } catch (error: any) {
      const message =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        'Error al cerrar la caja'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
      // Refrescar reconciliación por las dudas y página
      refetchReconciliation()
      window.location.reload()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Cerrar caja</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Antes de confirmar, revisá que el desglose de pagos coincida con lo
            registrado en las ventas del día.
          </DialogDescription>
        </DialogHeader>

        {/* Reconciliación */}
        <div className='rounded-md border p-3 space-y-2'>
          {reconciliationLoading ? (
            <div className='flex justify-center py-4'>
              <Loader />
            </div>
          ) : reconciliation ? (
            <>
              <div className='flex items-start gap-2'>
                {hasDiscrepancy ? (
                  <AlertTriangle className='h-4 w-4 text-red-600 mt-0.5' />
                ) : (
                  <CheckCircle2 className='h-4 w-4 text-emerald-600 mt-0.5' />
                )}
                <div className='flex-1 text-sm'>
                  <div className='font-medium'>
                    {hasDiscrepancy
                      ? 'Hay discrepancias entre la caja y las ventas'
                      : 'Caja y ventas coinciden ✓'}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {reconciliation.salesCount} ventas activas,{' '}
                    {reconciliation.cancelledCount} canceladas
                  </div>
                </div>
              </div>

              {reconciliation.paymentBreakdown.length > 0 && (
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs'>
                    <thead>
                      <tr className='border-b text-left text-muted-foreground'>
                        <th className='py-1 pr-2'>Método</th>
                        <th className='py-1 px-2 text-right'>Según caja</th>
                        <th className='py-1 px-2 text-right'>Según ventas</th>
                        <th className='py-1 pl-2 text-right'>Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.paymentBreakdown.map((line) => (
                        <tr
                          key={line.method}
                          className={`border-b last:border-b-0 ${
                            line.matches ? '' : 'bg-red-50'
                          }`}
                        >
                          <td className='py-1 pr-2'>
                            {METHOD_LABEL[line.method] || line.method}
                          </td>
                          <td className='py-1 px-2 text-right tabular-nums'>
                            {formatArs(line.expected)}
                          </td>
                          <td className='py-1 px-2 text-right tabular-nums'>
                            {formatArs(line.actual)}
                          </td>
                          <td
                            className={`py-1 pl-2 text-right tabular-nums ${
                              line.matches ? '' : 'font-semibold text-red-700'
                            }`}
                          >
                            {line.diff >= 0 ? '+' : ''}
                            {formatArs(line.diff)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className='py-2 text-center text-sm text-muted-foreground'>
              No se pudo obtener la reconciliación
            </p>
          )}
        </div>

        {/* Alerta de transferencias pendientes */}
        {canSeeTransfers && pendingTransfers?.data && pendingTransfers.data.length > 0 && (
          <div className='border border-yellow-200 bg-yellow-50 p-3 rounded-md'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='h-4 w-4 text-yellow-600 mt-0.5' />
              <div className='flex-1 flex flex-col sm:flex-row sm:items-center gap-2'>
                <span className='text-yellow-800 text-sm flex-1'>
                  Hay <strong>{pendingTransfers.data.length}</strong>{' '}
                  transferencia(s) pendiente(s) de verificación.
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowPendingTransfers(true)}
                >
                  Ver
                </Button>
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
                  <FormLabel className='text-sm sm:text-base'>
                    Efectivo contado físicamente
                  </FormLabel>
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
                  <FormLabel className='text-sm sm:text-base'>
                    Notas del cierre (opcional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='Observaciones generales del cierre...'
                      className='min-h-[60px]'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasDiscrepancy && (
              <FormField
                control={form.control}
                name='discrepancyNote'
                rules={{
                  required: 'Explicá la discrepancia para forzar el cierre'
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base text-red-700'>
                      Explicación de la discrepancia *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='Ej. faltante por vuelto mal entregado; cobré $200 sin registrar; etc.'
                        className='min-h-[80px] border-red-300'
                      />
                    </FormControl>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Queda registrado en el cierre para auditoría posterior.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                variant='outline'
                type='button'
                onClick={() => onOpenChange(false)}
                className='w-full sm:w-auto'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || reconciliationLoading}
                className={`w-full sm:w-auto ${
                  hasDiscrepancy ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
              >
                {isSubmitting
                  ? 'Cerrando...'
                  : hasDiscrepancy
                    ? 'Forzar cierre con discrepancia'
                    : 'Cerrar caja'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

      <Dialog open={showPendingTransfers} onOpenChange={setShowPendingTransfers}>
        <DialogContent className='w-[95vw] max-w-6xl max-h-[80vh] overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              Transferencias pendientes de verificación
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
