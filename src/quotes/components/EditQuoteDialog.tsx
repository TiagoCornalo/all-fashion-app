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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ComboboxProducts
} from '../../components'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Quote, UpdateQuoteDto, QuoteItem } from '../../types/quote.types'
import { updateQuote } from '../../services/quote.service'
import { fetchProducts } from '../../services'
import { toast } from 'react-toastify'
import DatePicker from '../../components/shared/DatePicker'
import { X, Plus, Edit } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

// Interfaces para tipado
interface Product {
  _id: string
  name: string
  code?: string
  price?: number
  stock?: number
  category?: string
  description?: string
}

interface EditQuoteDialogProps {
  quote: Quote | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onQuoteUpdated: () => Promise<void>
}

// Esquema de validación para editar (similar al de crear)
const formSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'El nombre del cliente es requerido'),
    documentType: z.enum(['DNI', 'CUIT', 'CUIL']).optional(),
    documentNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional()
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'El producto es requerido'),
        quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
        unitPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
        description: z.string().optional()
      })
    )
    .min(1, 'Debe agregar al menos un producto'),
  discount: z
    .object({
      type: z.enum(['percentage', 'fixed']),
      value: z.coerce.number().min(0, 'El descuento debe ser mayor o igual a 0'),
      description: z.string().optional()
    })
    .optional(),
  tax: z.coerce.number().min(0).default(0),
  validUntil: z.date().nullable().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional()
})

const EditQuoteDialog = ({
  quote,
  isOpen,
  onOpenChange,
  onQuoteUpdated
}: EditQuoteDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDiscount, setHasDiscount] = useState(false)

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
      customer: {
        name: '',
        documentType: 'DNI',
        documentNumber: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        postalCode: ''
      },
      items: [{ productId: '', quantity: 1, unitPrice: 0, description: '' }],
      discount: undefined,
      tax: 0,
      validUntil: null,
      notes: '',
      status: 'DRAFT'
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Cargar datos del remito a editar
  useEffect(() => {
    if (quote && isOpen) {
      // Preparar los items del remito para el formulario
      const quoteItems = quote.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        description: item.description || ''
      }))

      form.reset({
        customer: quote.customer,
        items: quoteItems.length > 0 ? quoteItems : [{ productId: '', quantity: 1, unitPrice: 0, description: '' }],
        discount: quote.discount,
        tax: quote.tax,
        validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
        notes: quote.notes || '',
        status: quote.status
      })

      setHasDiscount(!!quote.discount)
    }
  }, [quote, isOpen, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!quote) return

    setIsSubmitting(true)
    try {
      // Calcular subtotales para cada item
      const items: QuoteItem[] = values.items.map((item) => {
        const product = productsData?.data.find((p: Product) => p._id === item.productId)
        return {
          productId: item.productId,
          productCode: product?.code || '',
          productName: product?.name || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
          description: item.description
        }
      })

      const updatedQuote: UpdateQuoteDto = {
        customer: values.customer,
        items,
        discount: hasDiscount ? values.discount : undefined,
        tax: values.tax || 0,
        validUntil: values.validUntil || undefined,
        notes: values.notes,
        status: values.status
      }

      await updateQuote(quote._id!, updatedQuote)
      toast.success('Remito actualizado correctamente')
      onOpenChange(false)
      await onQuoteUpdated()
    } catch (error) {
      console.error('Error al actualizar remito:', error)
      toast.error('Error al actualizar el remito')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductChange = (index: number, productId: string) => {
    const product = productsData?.data.find((p: Product) => p._id === productId)
    if (product) {
      form.setValue(`items.${index}.productId`, productId)
      form.setValue(`items.${index}.unitPrice`, product.price || 0)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  if (!quote) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[95vw] max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col'>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Edit className='h-4 w-4 sm:h-5 sm:w-5' />
            Editar Remito N° {quote.number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 sm:space-y-6'>
              {/* Estado del documento */}
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">Borrador</SelectItem>
                        <SelectItem value="SENT">Enviado</SelectItem>
                        <SelectItem value="ACCEPTED">Aceptado</SelectItem>
                        <SelectItem value="REJECTED">Rechazado</SelectItem>
                        <SelectItem value="EXPIRED">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Datos del cliente */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold border-b pb-2">Datos del Cliente</h3>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                  <FormField
                    control={form.control}
                    name='customer.name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Nombre del cliente'
                            className="text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name='customer.documentType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Tipo Doc.</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-xs sm:text-sm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DNI">DNI</SelectItem>
                              <SelectItem value="CUIT">CUIT</SelectItem>
                              <SelectItem value="CUIL">CUIL</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='customer.documentNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Número</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='12345678'
                              className="text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='customer.phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='+54 11 1234-5678'
                            className="text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customer.email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder='cliente@email.com'
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
                  name='customer.address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Dirección</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Dirección completa'
                          className="text-xs sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4'>
                  <FormField
                    control={form.control}
                    name='customer.city'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Ciudad</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Ciudad'
                            className="text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customer.state'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Provincia</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Provincia'
                            className="text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customer.postalCode'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">C.P.</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='1234'
                            className="text-xs sm:text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Productos */}
              <div className='space-y-3 sm:space-y-4'>
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0'>
                  <h3 className="text-base sm:text-lg font-semibold text-center sm:text-left">Productos/Servicios</h3>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, description: '' })}
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
                    className='border p-3 sm:p-4 rounded-md space-y-3 sm:space-y-4'
                  >
                    <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4'>
                      <div className="lg:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Producto</FormLabel>
                              <FormControl>
                                <ComboboxProducts
                                  products={productsData?.data || []}
                                  value={field.value}
                                  onChange={(value) => handleProductChange(index, value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
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

                        <FormField
                          control={form.control}
                          name={`items.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Precio</FormLabel>
                              <FormControl>
                                <Input
                                  type='number'
                                  min={0}
                                  step="0.01"
                                  className="text-xs sm:text-sm"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Descripción adicional (opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Detalles adicionales del producto...'
                              className="text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <div className="flex justify-end">
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-red-600 text-xs sm:text-sm'
                          onClick={() => remove(index)}
                        >
                          <X className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Descuento */}
              <div className='space-y-3 sm:space-y-4'>
                <div className='flex items-center space-x-2'>
                  <input
                    type="checkbox"
                    id="hasDiscount"
                    checked={hasDiscount}
                    onChange={(e) => setHasDiscount(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="hasDiscount" className="text-sm sm:text-base">Aplicar descuento</Label>
                </div>

                {hasDiscount && (
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 border rounded-md'>
                    <FormField
                      control={form.control}
                      name='discount.type'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-xs sm:text-sm">
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Porcentaje</SelectItem>
                              <SelectItem value="fixed">Monto fijo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='discount.value'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Valor</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min={0}
                              step="0.01"
                              className="text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='discount.description'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Descripción</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Desc. por...'
                              className="text-xs sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Impuestos y validez */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <FormField
                  control={form.control}
                  name='tax'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Impuestos</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          step="0.01"
                          placeholder='0.00'
                          className="text-xs sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='validUntil'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Válido Hasta</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value || null}
                          onChange={field.onChange}
                          placeholder='Seleccionar fecha'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Notas/Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Notas adicionales, condiciones especiales, etc.'
                        className="min-h-[80px] text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
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
                  {isSubmitting ? 'Guardando...' : 'Actualizar Remito'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditQuoteDialog