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
  Textarea,
  ComboboxProducts
} from '../../components'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProductCombo, UpdateProductComboDto } from '../../types/combos.types'
import { updateCombo } from '../../services/combos'
import { toast } from 'react-toastify'
import DatePicker from '../../components/shared/DatePicker'
import { X, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../../services'

interface EditComboDialogProps {
  combo: ProductCombo | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComboUpdated: () => Promise<void>
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

const EditComboDialog = ({
  combo,
  isOpen,
  onOpenChange,
  onComboUpdated
}: EditComboDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLimitless, setIsLimitless] = useState(combo?.usageLimit === null)

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

  // Cargar datos del combo a editar
  useEffect(() => {
    if (combo && isOpen) {
      // Preparar los items del combo para el formulario correctamente
      // AQUÍ ESTÁ EL CAMBIO PRINCIPAL - Manejar la estructura anidada de productos
      const comboItems = combo.items.map((item) => {
        // Verificar si el producto es un objeto anidado o solo un ID
        const productId =
          typeof item.product === 'object'
            ? item.product._id // Si es un objeto, obtener su ID
            : item.product // Si ya es un ID, usarlo directamente

        return {
          product: productId,
          quantity: item.quantity
        }
      })

      form.reset({
        code: combo.code,
        name: combo.name,
        description: combo.description || '',
        price: combo.price,
        items:
          comboItems.length > 0 ? comboItems : [{ product: '', quantity: 1 }],
        usageLimit: combo.usageLimit,
        isActive: combo.isActive,
        startDate: combo.startDate ? new Date(combo.startDate) : null,
        endDate: combo.endDate ? new Date(combo.endDate) : null
      })

      setIsLimitless(combo.usageLimit === null)
    }
  }, [combo, isOpen, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!combo) return

    setIsSubmitting(true)
    try {
      const updatedCombo: UpdateProductComboDto = {
        name: values.name,
        description: values.description,
        price: values.price,
        items: values.items,
        usageLimit: isLimitless ? null : values.usageLimit,
        isActive: values.isActive,
        startDate: values.startDate,
        endDate: values.endDate
      }

      await updateCombo(combo._id, updatedCombo)
      toast.success('Combo actualizado correctamente')
      onOpenChange(false)
      await onComboUpdated()
    } catch (error) {
      console.error('Error al actualizar combo:', error)
      toast.error('Error al actualizar el combo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!combo) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Combo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ej. COMBO01'
                        {...field}
                        disabled // El código no se debe modificar
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
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder='Ej. Combo Familiar' {...field} />
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
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Describe el combo' {...field} />
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
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0}
                      step='0.01'
                      placeholder='Ej. 999.99'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <FormLabel>Productos en el combo</FormLabel>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => append({ product: '', quantity: 1 })}
                >
                  <Plus className='h-4 w-4 mr-1' /> Agregar producto
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex gap-2 items-center border p-3 rounded-md'
                >
                  <div className='flex-1'>
                    <FormField
                      control={form.control}
                      name={`items.${index}.product`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Producto</FormLabel>
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

                  <div className='w-24'>
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input type='number' min={1} {...field} />
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
                      className='self-end mb-1'
                      onClick={() => remove(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              ))}

              {form.formState.errors.items?.root && (
                <p className='text-sm font-medium text-red-500'>
                  {form.formState.errors.items.root.message}
                </p>
              )}
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='limitless'
                checked={isLimitless}
                onCheckedChange={setIsLimitless}
              />
              <Label htmlFor='limitless'>Sin límite de usos</Label>
            </div>

            {!isLimitless && (
              <FormField
                control={form.control}
                name='usageLimit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Límite de Usos</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        placeholder='Ej. 100'
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
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel>Activo</FormLabel>
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

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
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
                    <FormLabel>Fecha de Fin</FormLabel>
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

            <div className='mt-4 text-sm text-gray-500'>
              <p>Usos actuales: {combo.currentUsageCount}</p>
              <p>Creado: {new Date(combo.createdAt).toLocaleDateString()}</p>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={handleClose}>
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditComboDialog
