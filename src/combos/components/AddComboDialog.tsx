import { useState } from 'react'
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
  Textarea,
  ComboboxProducts
} from '../../components'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreateProductComboDto } from '../../types/combos.types'
import { createCombo } from '../../services/combos'
import { toast } from 'react-toastify'
import DatePicker from '../../components/shared/DatePicker'
import { X, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services'

interface AddComboDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComboAdded: () => Promise<void>
}

// Esquema de validación para el formulario
const formSchema = z
  .object({
    code: z.string().min(1, 'El código es requerido').max(50),
    name: z.string().min(1, 'El nombre es requerido'),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
    items: z
      .array(
        z.object({
          product: z.string().min(1, 'El producto es requerido'),
          quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0')
        })
      )
      .min(1, 'Debe agregar al menos un producto'),
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

const AddComboDialog = ({
  isOpen,
  onOpenChange,
  onComboAdded
}: AddComboDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLimitless, setIsLimitless] = useState(false)

  // Cargar productos para seleccionarlos
  const { data: productsData } = useQuery({
    queryKey: ['products-basic'],
    queryFn: () =>
      fetchProducts({
        page: 1,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        search: '',
        filters: {}
      })
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      price: 0,
      items: [{ product: '', quantity: 1 }],
      usageLimit: null,
      isActive: true,
      startDate: null,
      endDate: null
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const newCombo: CreateProductComboDto = {
        ...values,
        usageLimit: isLimitless ? null : values.usageLimit,
        startDate: values.startDate,
        endDate: values.endDate
      }

      await createCombo(newCombo)
      toast.success('Combo creado correctamente')
      form.reset()
      onOpenChange(false)
      await onComboAdded()
    } catch (error) {
      console.error('Error al crear combo:', error)
      toast.error('Error al crear el combo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[95vw] max-w-xl sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg">Crear Nuevo Combo</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <FormField
                  control={form.control}
                  name='code'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Código</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ej. COMBO01'
                          className="text-xs sm:text-sm"
                          {...field}
                          autoCapitalize='characters'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Nombre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Ej. Combo Familiar'
                          className="text-xs sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Describe el combo'
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
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Precio</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        step='0.01'
                        placeholder='Ej. 999.99'
                        className="text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2 sm:space-y-3'>
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0'>
                  <FormLabel className="text-xs sm:text-sm text-center sm:text-left">Productos en el combo</FormLabel>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => append({ product: '', quantity: 1 })}
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                    <span className="hidden sm:inline">Agregar producto</span>
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className='flex flex-col sm:flex-row gap-2 sm:items-end border p-2 sm:p-3 rounded-md'
                  >
                    <div className='flex-1'>
                      <FormField
                        control={form.control}
                        name={`items.${index}.product`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Producto</FormLabel>
                            <FormControl>
                              <ComboboxProducts
                                products={productsData?.data || []}
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='w-full sm:w-24'>
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs sm:text-sm">Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min={1}
                                className="text-xs sm:text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='w-full sm:w-auto sm:self-end sm:mb-1 text-xs sm:text-sm'
                        onClick={() => remove(index)}
                      >
                        <X className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-0' />
                        <span className="sm:hidden">Eliminar</span>
                      </Button>
                    )}
                  </div>
                ))}

                {form.formState.errors.items?.root && (
                  <p className='text-xs sm:text-sm font-medium text-red-500'>
                    {form.formState.errors.items.root.message}
                  </p>
                )}
              </div>

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

export default AddComboDialog
