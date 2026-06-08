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
  const [isFocused, setIsFocused] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false)

  const fetchLastRegister = useCallback(async () => {
    try {
      await fetchLastClosedRegister()
    } catch (error) {
      console.error('Error al cargar último registro:', error)
      setHasAttemptedFetch(true)
    }
  }, [fetchLastClosedRegister])

  useEffect(() => {
    let isMounted = true

    if (isMounted && !hasAttemptedFetch && !lastClosedRegister && !isLoading) {
      fetchLastRegister()
    }

    return () => {
      isMounted = false
    }
  }, [fetchLastRegister, lastClosedRegister, isLoading, hasAttemptedFetch])

  useEffect(() => {
    const suggestedBalance =
      lastClosedRegister?.closingSummary?.actualCash ??
      lastClosedRegister?.currentBalance ??
      0

    if (suggestedBalance > 0) {
      setLocalInitialBalance(suggestedBalance)
      setInputValue(suggestedBalance.toString())
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

  if (!isAuthenticated) return null

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
      const message =
        (error as any)?.response?.data?.details ||
        (error as any)?.response?.data?.error ||
        'Error al abrir la caja'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[95vw] max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Abrir Caja</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
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
                  <FormLabel className='text-sm sm:text-base'>Saldo Inicial</FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={isFocused ? inputValue : field.value}
                      onFocus={() => {
                        setIsFocused(true)
                        setInputValue(
                          field.value === 0 ? '' : field.value.toString()
                        )
                      }}
                      onBlur={() => {
                        setIsFocused(false)
                        if (inputValue === '') {
                          field.onChange(0)
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '')
                        setInputValue(value)

                        if (value !== '') {
                          field.onChange(Number(value))
                        }
                      }}
                      className='h-9 sm:h-10'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant='outline'
                  type='button'
                  className='w-full sm:w-auto h-9 sm:h-10'
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={isSubmitting || isLoading}
                className='w-full sm:w-auto h-9 sm:h-10'
              >
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
