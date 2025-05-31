import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar as CalendarComponent
} from '../../components'
import { scheduleArrival } from '../../services/order'
import { toast } from 'react-toastify'
import { Truck, Calendar } from 'lucide-react'
import { RECEPTION_STATUS } from '../../utils/constants'

interface Order {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  status: 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'IN_TRANSIT'
  totalQuantity: number
  createdAt: string
  updatedAt: string
  notes?: string
}

interface ScheduleArrivalDialogProps {
  order: Order | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: () => void
}

// Schema de validación
const scheduleArrivalSchema = z.object({
  scheduledDate: z.date({
    required_error: 'Debe seleccionar una fecha de llegada',
  }).refine(
    (date) => {
      // Obtener fecha actual en UTC-3 (Argentina)
      const now = new Date()
      const utcMinus3 = new Date(now.getTime() - (3 * 60 * 60 * 1000))
      const today = new Date(utcMinus3.getFullYear(), utcMinus3.getMonth(), utcMinus3.getDate())

      // Convertir fecha seleccionada a solo fecha (sin hora)
      const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      return selectedDate >= today
    },
    {
      message: 'No se puede programar una fecha en el pasado'
    }
  ),
  notes: z.string().optional()
})

type ScheduleArrivalFormValues = z.infer<typeof scheduleArrivalSchema>

/**
 * Modal para programar la fecha de llegada de un pedido en tránsito
 */
const ScheduleArrivalDialog = ({
  order,
  isOpen,
  onOpenChange,
  onOrderUpdated
}: ScheduleArrivalDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ScheduleArrivalFormValues>({
    resolver: zodResolver(scheduleArrivalSchema),
    defaultValues: {
      scheduledDate: undefined,
      notes: ''
    }
  })

  // Resetear formulario cuando se abre el modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    }
    onOpenChange(open)
  }

  const onSubmit = async (values: ScheduleArrivalFormValues) => {
    if (!order) return

    try {
      setIsSubmitting(true)

      const scheduledDate = values.scheduledDate.toISOString().split('T')[0]

      await scheduleArrival(order._id, {
        scheduledDate,
        notes: values.notes || undefined
      })

      toast.success(`Pedido programado para llegar el ${values.scheduledDate.toLocaleDateString('es-ES')}`)
      onOrderUpdated()
      handleOpenChange(false)
    } catch (error: unknown) {
      console.error('Error al programar llegada del pedido:', error)
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al programar la llegada del pedido'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Truck className='h-5 w-5 text-blue-600' />
            Programar Llegada del Pedido
          </DialogTitle>
        </DialogHeader>

        <div className='mb-4 p-3 bg-blue-50 rounded-lg'>
          <h4 className='font-medium text-blue-800 mb-1'>Pedido de {order.supplier.name}</h4>
          <p className='text-sm text-blue-600'>
            {order.totalQuantity} productos • Estado: {RECEPTION_STATUS[order.status as keyof typeof RECEPTION_STATUS]}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='scheduledDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4' />
                    Fecha de Llegada Programada
                  </FormLabel>
                  <FormControl>
                    <div className='w-full'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <Calendar className='mr-2 h-4 w-4' />
                            {field.value ? (
                              field.value.toLocaleDateString('es-ES')
                            ) : (
                              <span>Seleccionar fecha de llegada</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <CalendarComponent
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => {
                              // Obtener fecha actual en UTC-3 (Argentina)
                              const now = new Date()
                              const utcMinus3 = new Date(now.getTime() - (3 * 60 * 60 * 1000))
                              const today = new Date(utcMinus3.getFullYear(), utcMinus3.getMonth(), utcMinus3.getDate())

                              // Convertir fecha a comparar a solo fecha (sin hora)
                              const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

                              return compareDate < today
                            }}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
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
                  <FormLabel>Notas adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Agregar notas sobre la llegada del pedido...'
                      className='resize-none'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Programando...' : 'Programar Llegada'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ScheduleArrivalDialog