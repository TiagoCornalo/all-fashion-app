import { useState, useEffect, useCallback } from 'react'
import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import {
  Dialog,
  DialogClose,
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
import { useAuth } from '../../context/auth/useAuth'

const formSchema = z.object({
  initialBalance: z
    .number()
    .min(0, 'El saldo inicial debe ser mayor o igual a 0')
})

type FormValues = z.infer<typeof formSchema>

interface OpenRegisterDialogProps {
  isOpen: boolean
  onClose?: () => void
}

const OpenRegisterDialog = ({ isOpen, onClose }: OpenRegisterDialogProps) => {
  const { isAuthenticated } = useAuth()
  const {
    openRegister,
    currentRegister,
    fetchLastClosedRegister,
    lastClosedRegister,
    isLoading
  } = useCashRegisterStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localInitialBalance, setLocalInitialBalance] = useState(
    lastClosedRegister?.closingSummary?.actualCash || 0
  )

  if (!isAuthenticated) return null

  const fetchLastRegister = useCallback(async () => {
    try {
      await fetchLastClosedRegister()
    } catch (error) {
      console.error('Error al cargar último registro:', error)
    }
  }, [fetchLastClosedRegister])

  useEffect(() => {
    let isMounted = true

    if (isMounted && !lastClosedRegister && !isLoading) {
      fetchLastRegister()
    }

    return () => {
      isMounted = false
    }
  }, [fetchLastRegister, lastClosedRegister, isLoading])

  useEffect(() => {
    if (lastClosedRegister?.currentBalance) {
      setLocalInitialBalance(lastClosedRegister.currentBalance)
    }
  }, [lastClosedRegister])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialBalance: localInitialBalance
    }
  })

  useEffect(() => {
    form.setValue('initialBalance', localInitialBalance)
  }, [localInitialBalance, form])

  if (currentRegister) return null

  const onSubmit = async (values: FormValues) => {
    if (!isAuthenticated) {
      toast.error('Debe iniciar sesión para abrir la caja')
      return
    }

    try {
      setIsSubmitting(true)
      await openRegister(values.initialBalance)
      toast.success('Caja abierta correctamente')
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al abrir la caja')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                          e.target.value === '' ? 0 : Number(e.target.value)
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant='outline' type='button'>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type='submit' disabled={isSubmitting || isLoading}>
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
