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
import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import { useState } from 'react'
import { AxiosError } from 'axios'

const formSchema = z.object({
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  notes: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

const WithdrawalDialog = ({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { currentRegister, withdraw } = useCashRegisterStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      notes: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    if (!currentRegister) return

    try {
      setIsSubmitting(true)
      await withdraw(currentRegister._id, values.amount, values.notes)
      toast.success('Retiro realizado correctamente')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error al realizar el retiro:', error)

      if (error instanceof AxiosError && error.response?.data) {
        const errorData = error.response.data
        if (errorData && errorData.error) {
          if (errorData.error.includes('Saldo insuficiente')) {
            toast.error(
              `${errorData.error}. Balance actual: $${errorData.currentBalance}, Monto solicitado: $${errorData.requestedAmount}`
            )
          } else {
            toast.error(errorData.error)
          }
          return
        }
      }

      toast.error('Error al realizar el retiro')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Retiro</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Ingrese el monto a retirar y las notas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Monto a retirar</FormLabel>
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
                variant='error'
                className='w-full sm:w-auto h-9 sm:h-10'
              >
                {isSubmitting ? 'Retirando...' : 'Retirar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
export default WithdrawalDialog
