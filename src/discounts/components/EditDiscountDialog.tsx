import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Switch,
  Textarea
} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Discount, UpdateDiscount } from '../../types/discount.types'
import { updateDiscount } from '../../services/discounts'
import { toast } from 'react-toastify'
import DatePicker from '../../components/shared/DatePicker'

interface EditDiscountDialogProps {
  discount: Discount | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDiscountUpdated: () => Promise<void>
}

// Esquema de validación para el formulario
const formSchema = z
  .object({
    code: z.string().min(1, 'El código es requerido').max(50),
    description: z.string().min(1, 'La descripción es requerida'),
    discountPercentage: z.coerce
      .number()
      .min(1, 'El descuento debe ser mayor a 0')
      .max(100, 'El descuento no puede ser mayor a 100%'),
    usageLimit: z.union([
      z.coerce.number().min(1, 'El límite debe ser mayor a 0'),
      z.literal(null)
    ]),
    isActive: z.boolean().default(true),
    startDate: z.date().nullable(),
    endDate: z
      .date()
      .nullable()
      .refine((date) => date === null || new Date() <= date, {
        message: 'La fecha de fin debe ser posterior a la fecha actual'
      })
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate
      }
      return true
    },
    {
      message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      path: ['endDate']
    }
  )

const EditDiscountDialog = ({
  discount,
  isOpen,
  onOpenChange,
  onDiscountUpdated
}: EditDiscountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLimitless, setIsLimitless] = useState(discount?.usageLimit === null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      description: '',
      discountPercentage: 10,
      usageLimit: null,
      isActive: true,
      startDate: null,
      endDate: null
    }
  })

  useEffect(() => {
    if (discount && isOpen) {
      form.reset({
        code: discount.code,
        description: discount.description,
        discountPercentage: discount.discountPercentage,
        usageLimit: discount.usageLimit,
        isActive: discount.isActive,
        startDate: discount.startDate ? new Date(discount.startDate) : null,
        endDate: discount.endDate ? new Date(discount.endDate) : null
      })
      setIsLimitless(discount.usageLimit === null)
    }
  }, [discount, isOpen, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!discount) return

    setIsSubmitting(true)
    try {
      const updatedDiscount: UpdateDiscount = {
        code: values.code,
        description: values.description,
        discountPercentage: values.discountPercentage,
        usageLimit: isLimitless ? null : values.usageLimit,
        isActive: values.isActive,
        startDate: values.startDate,
        endDate: values.endDate
      }

      await updateDiscount(discount._id, updatedDiscount)
      toast.success('Descuento actualizado correctamente')
      onOpenChange(false)
      await onDiscountUpdated()
    } catch (error) {
      console.error('Error al actualizar descuento:', error)
      toast.error('Error al actualizar el descuento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!discount) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[95vw] max-w-lg sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">Editar Descuento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej. BIENVENIDA20'
                        className="text-xs sm:text-sm"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe el propósito del descuento'
                        className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='discountPercentage'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Porcentaje de Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        max={100}
                        placeholder='Ej. 20'
                        className="text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center space-x-2 p-3 sm:p-4 border rounded-lg'>
                <Switch
                  id='limitless'
                  checked={isLimitless}
                  onCheckedChange={setIsLimitless}
                />
                <Label htmlFor='limitless' className="text-xs sm:text-sm">Sin límite de usos</Label>
              </div>

              {!isLimitless && (
                <FormField
                  control={form.control}
                  name='usageLimit'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Límite de Usos</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={1}
                          placeholder='Ej. 100'
                          className="text-xs sm:text-sm"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => {
                            const value =
                              e.target.value === ''
                                ? null
                                : parseInt(e.target.value, 10)
                            field.onChange(value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className="text-xs sm:text-sm">Activo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <FormField
                  control={form.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Fecha de Inicio</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onChange={field.onChange}
                          placeholder='Seleccionar fecha de inicio'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Fecha de Fin</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          onChange={field.onChange}
                          placeholder='Seleccionar fecha de fin'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg'>
                <div className='text-xs sm:text-sm text-gray-500 space-y-1'>
                  <p className="break-words">
                    <span className="font-medium">Creado:</span> {new Date(discount.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">Usos actuales:</span> {discount.currentUsageCount}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleClose}
                  className="w-full sm:w-auto text-xs sm:text-sm order-2 sm:order-1"
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-xs sm:text-sm order-1 sm:order-2"
                  size="sm"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditDiscountDialog
