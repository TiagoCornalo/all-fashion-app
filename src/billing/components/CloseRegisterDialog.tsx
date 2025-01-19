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
  Textarea
} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-toastify'

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualCash: 0,
      notes: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!currentRegister) return

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
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar Caja</DialogTitle>
          <DialogDescription>
            Ingrese el monto final y las notas para cerrar la caja
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='actualCash'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto Final</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
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
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder='Notas adicionales...' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Cerrando...' : 'Cerrar Caja'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default CloseRegisterDialog
