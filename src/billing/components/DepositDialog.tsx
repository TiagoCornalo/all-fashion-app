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

const formSchema = z.object({
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  notes: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

const DepositDialog = ({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { currentRegister, deposit } = useCashRegisterStore()
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
      await deposit(currentRegister._id, values.amount, values.notes)
      toast.success('Depósito realizado correctamente')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error al realizar el depósito:', error)
      toast.error('Error al realizar el depósito')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Depósito</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Ingrese el monto a depositar y las notas
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Monto a depositar</FormLabel>
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
                variant='success'
                className='w-full sm:w-auto h-9 sm:h-10'
              >
                {isSubmitting ? 'Depositando...' : 'Depositar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default DepositDialog
