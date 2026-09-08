import { useState, useEffect } from 'react'
import { useInventory } from '../../../context/InventoryContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox,
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
import { addProduct } from '../../../../services'
import { useExchangeRate } from '../../../../hooks/useExchangeRate'
import { Product, USDRateType } from '../../../../types/inventory.types'
import { convertUsdToArs, getEffectiveUsdRate } from '../../../../utils/usdPricing'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AxiosError } from 'axios'
import { ScanBarcode } from 'lucide-react'
import { useBarcodeScanner } from '../../../../hooks/useBarcodeScanner'

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  stockMinimum: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val || 0)),
  basePrice: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  priceUSD: z
    .union([z.string(), z.number(), z.literal('')])
    .transform((val) =>
      val === '' || val === undefined || val === null ? null : Number(val)
    )
    .nullable()
    .optional(),
  usdRateType: z.enum(['blue', 'oficial']).default('blue'),
  barcode: z.string().trim().max(128, 'El código es demasiado largo')
    .refine((value) => !value || value.length >= 3, 'El código debe tener al menos 3 caracteres')
    .optional(),
  barcodeUnitsPerScan: z
    .union([z.string(), z.number()])
    .transform((val) => Math.max(1, Number(val || 1))),
  supplierId: z.string().min(1, 'El proveedor es requerido')
})

type FormValues = z.infer<typeof formSchema>

interface AddProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (product: Product) => void
}

const formatArs = (value: number) =>
  value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  })

const AddProductDialog = ({ isOpen, onOpenChange, onCreated }: AddProductDialogProps) => {
  const { refreshTable } = useInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usdEnabled, setUsdEnabled] = useState(false)
  const [printLabelAfterCreate, setPrintLabelAfterCreate] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      stock: 0,
      stockMinimum: 0,
      basePrice: 0,
      price: 0,
      priceUSD: null,
      usdRateType: 'blue',
      barcode: '',
      barcodeUnitsPerScan: 1,
      supplierId: ''
    }
  })

  const priceUSDValue = form.watch('priceUSD')
  const usdRateType = form.watch('usdRateType') as USDRateType
  const { data: rate } = useExchangeRate(usdRateType)
  const previewPrice =
    usdEnabled && rate && typeof priceUSDValue === 'number' && priceUSDValue > 0
      ? convertUsdToArs(priceUSDValue, rate.value, rate.surchargeArs)
      : null
  const effectiveRate = rate
    ? getEffectiveUsdRate(rate.value, rate.surchargeArs)
    : null

  useEffect(() => {
    if (previewPrice !== null) {
      form.setValue('price', Math.round(previewPrice * 100) / 100)
    }
  }, [previewPrice, form])

  useBarcodeScanner({
    enabled: isOpen && !isSubmitting,
    onScan: (value) => {
      form.setValue('barcode', value, { shouldDirty: true, shouldValidate: true })
      toast.success('Código de barras capturado')
    }
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      const createdProduct = await addProduct({
        ...values,
        baseCurrency: usdEnabled ? 'USD' : 'ARS',
        priceUSD: usdEnabled ? values.priceUSD ?? null : null,
        usdRateType: usdEnabled ? values.usdRateType : null,
        description: '',
        supplier: {
          _id: values.supplierId,
          name: '',
          contact: { email: '', phone: '' }
        }
      })
      onOpenChange(false)
      form.reset()
      setUsdEnabled(false)
      await refreshTable()
      toast.success('Producto agregado correctamente')
      if (printLabelAfterCreate) {
        setPrintLabelAfterCreate(false)
        onCreated?.(createdProduct)
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(`Error al agregar el producto: ${
          error.response?.data?.details || error.response?.data?.error || error.message
        }`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Agregar Producto</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Complete la información del nuevo producto
          </DialogDescription>
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

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]'>
                <FormField
                  control={form.control}
                  name='barcode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2 text-sm sm:text-base'>
                        <ScanBarcode className='h-4 w-4' />
                        Código de barras
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Opcional: escanealo ahora'
                          className='h-9 sm:h-10'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='barcodeUnitsPerScan'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm sm:text-base'>Unidades</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='number'
                          min={1}
                          className='h-9 sm:h-10'
                          onChange={(event) => field.onChange(Number(event.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <label className='flex items-center gap-2 rounded-md border p-3 text-sm'>
                <Checkbox
                  checked={printLabelAfterCreate}
                  onCheckedChange={(checked) => setPrintLabelAfterCreate(checked === true)}
                />
                Abrir el centro de etiquetas después de guardar
              </label>

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

              <FormField
                control={form.control}
                name='basePrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base'>
                      Precio base / costo ({usdEnabled ? 'USD' : 'ARS'})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        {...field}
                        className='h-9 sm:h-10'
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? '' : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        Cotización publicada: {formatArs(rate.value)} ({rate.type})
                        {' + '}ajuste {formatArs(rate.surchargeArs)}. Cotización
                        aplicada: {effectiveRate === null ? '—' : formatArs(effectiveRate)}
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

export default AddProductDialog
