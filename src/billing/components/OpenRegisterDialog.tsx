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
  FormMessage
} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-toastify'

const formSchema = z.object({
  initialBalance: z
    .number()
    .min(0, 'El saldo inicial debe ser mayor o igual a 0')
})

type FormValues = z.infer<typeof formSchema>

const OpenRegisterDialog = () => {
  const { openRegister, currentRegister } = useCashRegisterStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialBalance: 0
    }
  })

  if (currentRegister) return null

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await openRegister(values.initialBalance)
      toast.success('Caja abierta correctamente')
    } catch (error) {
      console.error(error)
      toast.error('Error al abrir la caja')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
          <DialogDescription>
            Ingrese el saldo inicial para abrir la caja del día
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='initialBalance'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial</FormLabel>
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

            <DialogFooter>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default OpenRegisterDialog
