import { useState, useEffect } from 'react'
import { useInventory } from '../../../context/InventoryContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../../../components'
import { Switch } from '../../../../components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select'
import { ComboboxSuppliers } from '../../../../components/ui/combobox-suppliers'
import { Product, USDRateType } from '../../../../types/inventory.types'
import { editProduct } from '../../../../services'
import { useExchangeRate } from '../../../../hooks/useExchangeRate'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  stockMinimum: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val || 0)),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  priceUSD: z
    .union([z.string(), z.number(), z.literal('')])
    .transform((val) =>
      val === '' || val === undefined || val === null ? null : Number(val)
    )
    .nullable()
    .optional(),
  usdRateType: z.enum(['blue', 'oficial']).default('blue'),
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  description: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface EditProductDialogProps {
  product: Product | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const formatArs = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const EditProductDialog = ({
  product,
  isOpen,
  onOpenChange
}: EditProductDialogProps) => {
  const { refreshTable } = useInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usdEnabled, setUsdEnabled] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      stock: 0,
      stockMinimum: 0,
      price: 0,
      priceUSD: null,
      usdRateType: 'blue',
      supplierId: '',
      description: ''
    }
  })

  useEffect(() => {
    if (product) {
      const hasUSD =
        typeof product.priceUSD === 'number' && product.priceUSD > 0
      setUsdEnabled(hasUSD)
      form.reset({
        code: product.code,
        name: product.name,
        stock: product.stock,
        stockMinimum: product.stockMinimum,
        price: product.price,
        priceUSD: hasUSD ? product.priceUSD! : null,
        usdRateType: hasUSD ? (product.usdRateType || 'blue') : 'blue',
        supplierId: product.supplier._id,
        description: product.description || ''
      })
    }
  }, [product, form])

  const priceUSDValue = form.watch('priceUSD')
  const usdRateType = form.watch('usdRateType') as USDRateType
  const { data: rate } = useExchangeRate(usdRateType)
  const previewPrice =
    usdEnabled && rate && typeof priceUSDValue === 'number' && priceUSDValue > 0
      ? priceUSDValue * rate.value + (rate.surchargeArs || 0)
      : null

  useEffect(() => {
    if (previewPrice !== null) {
      form.setValue('price', Math.round(previewPrice * 100) / 100)
    }
  }, [previewPrice, form])

  const onSubmit = async (values: FormValues) => {
    if (!product?._id) return

    try {
      setIsSubmitting(true)
      await editProduct({
        _id: product._id,
        ...values,
        priceUSD: usdEnabled ? values.priceUSD ?? null : null,
        usdRateType: usdEnabled ? values.usdRateType : null,
        description: values.description || '',
        supplier: {
          _id: values.supplierId,
          name: '',
          contact: { email: '', phone: '' }
        },
        createdAt: product.createdAt,
        updatedAt: new Date().toISOString()
      })
      toast.success('Producto actualizado exitosamente')
      refreshTable()
      onOpenChange(false)
    } catch (error) {
      toast.error('Error al actualizar el producto')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Editar Producto</DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base'>Código</FormLabel>
                    <FormControl>
                      <Input {...field} className='h-9 sm:h-10' />
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
                    <FormLabel className='text-sm sm:text-base'>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} className='h-9 sm:h-10' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <FormField
                  control={form.control}
                  name='stock'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm sm:text-base'>Stock</FormLabel>
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
                  name='stockMinimum'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm sm:text-base'>Stock Mínimo</FormLabel>
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
              </div>

              <div className='rounded-md border p-3 space-y-3'>
                <label className='flex items-center justify-between gap-2 text-sm'>
                  <span className='font-medium'>Cargar precio en dólares</span>
                  <Switch
                    checked={usdEnabled}
                    onCheckedChange={(checked) => {
                      setUsdEnabled(checked)
                      if (!checked) form.setValue('priceUSD', null)
                    }}
                  />
                </label>

                {usdEnabled && (
                  <>
                    <FormField
                      control={form.control}
                      name='usdRateType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>Tipo de dólar</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className='h-9 sm:h-10'>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='blue'>Dólar blue (+$100)</SelectItem>
                              <SelectItem value='oficial'>Dólar oficial (+$50)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='priceUSD'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-sm'>Precio en USD</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              step='0.01'
                              value={field.value ?? ''}
                              className='h-9 sm:h-10'
                              onChange={(e) => {
                                const value =
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value)
                                field.onChange(value)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {rate ? (
                      <p className='text-xs text-muted-foreground'>
                        Cotización vigente: {formatArs(rate.value)} (
                        {rate.type}) + recargo {formatArs(rate.surchargeArs)}
                      </p>
                    ) : (
                      <p className='text-xs text-amber-700'>
                        Sin cotización cargada todavía. Se calculará cuando refresques.
                      </p>
                    )}

                    {previewPrice !== null && (
                      <p className='text-sm font-medium text-green-700'>
                        Equivale a {formatArs(previewPrice)} pesos
                      </p>
                    )}
                  </>
                )}
              </div>

              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base'>
                      Precio en pesos
                      {usdEnabled && (
                        <span className='ml-2 text-xs text-muted-foreground'>
                          (calculado desde USD)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
                        disabled={usdEnabled}
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
                name='supplierId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base'>Proveedor</FormLabel>
                    <FormControl>
                      <ComboboxSuppliers
                        value={field.value}
                        onChange={field.onChange}
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
                  type='button'
                  className='w-full sm:w-auto h-9 sm:h-10'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full sm:w-auto h-9 sm:h-10'
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

export default EditProductDialog
