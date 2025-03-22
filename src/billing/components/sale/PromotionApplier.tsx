import { useState } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import {
  Input,
  Button,
  Label,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  FormItem,
  FormControl,
  Form
} from '../../../components'
import { TagIcon, PlusCircle, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '../../../services/config/axios'
import { toast } from 'react-toastify'

const formSchema = z.object({
  promotionCode: z.string().min(1, 'El código de promoción es requerido')
})

const itemPromotionSchema = z.object({
  itemIndex: z.string().min(1, 'Debe seleccionar un producto'),
  promotionCode: z.string().min(1, 'El código de promoción es requerido')
})

const PromotionApplier = () => {
  const {
    items,
    promotionCode,
    setPromotionCode,
    itemPromotions,
    addItemPromotion,
    removeItemPromotion,
    replaceItems,
    removeGlobalPromotion
  } = useSaleStore()

  const [validating, setValidating] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promotionCode: promotionCode || ''
    }
  })

  const itemPromotionForm = useForm<z.infer<typeof itemPromotionSchema>>({
    resolver: zodResolver(itemPromotionSchema),
    defaultValues: {
      itemIndex: '',
      promotionCode: ''
    }
  })

  const onSubmitGlobalPromo = async (values: z.infer<typeof formSchema>) => {
    try {
      setValidating(true)

      const currentItems = useSaleStore.getState().items

      const response = await api.post(
        `/promotions/validate/${values.promotionCode}`,
        {
          items: currentItems,
          applyToItems: []
        }
      )

      if (response.data.valid) {
        const itemsWithDiscount = response.data.items

        replaceItems(itemsWithDiscount)

        setPromotionCode(values.promotionCode)

        const discountPercentage =
          response.data.promotion?.discountPercentage || 0
        useSaleStore.getState().setDiscount(discountPercentage)

        toast.success(
          `Código de promoción aplicado: ${discountPercentage}% de descuento`
        )
      } else {
        toast.error(response.data.error || 'Código de promoción inválido')
      }
    } catch (error) {
      console.error('Error al validar código de promoción:', error)
      toast.error('Error al validar código de promoción')
    } finally {
      setValidating(false)
    }
  }

  const onSubmitItemPromo = async (
    values: z.infer<typeof itemPromotionSchema>
  ) => {
    try {
      setValidating(true)

      // Obtener items actuales
      const currentItems = useSaleStore.getState().items

      // Usar el nuevo endpoint POST
      const response = await api.post(
        `/promotions/validate/${values.promotionCode}`,
        {
          items: currentItems,
          applyToItems: [parseInt(values.itemIndex)] // Solo aplicar a este item
        }
      )

      if (response.data.valid) {
        // Reemplazar items en el store
        replaceItems(response.data.items)

        // Registrar la promoción por item
        addItemPromotion(parseInt(values.itemIndex), values.promotionCode)

        toast.success('Promoción aplicada al producto')
        itemPromotionForm.reset({
          itemIndex: '',
          promotionCode: ''
        })
      } else {
        toast.error(response.data.error || 'Código de promoción inválido')
      }
    } catch (error) {
      console.error('Error al validar código de promoción:', error)
      toast.error('Error al validar código de promoción')
    } finally {
      setValidating(false)
    }
  }

  const handleRemoveGlobalPromotion = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault()
    e.stopPropagation()

    removeGlobalPromotion()
    toast.success('Promoción global eliminada')
  }

  return (
    <div className='space-y-6 mt-4'>
      <Card>
        <CardHeader>
          <CardTitle>Promociones</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Promoción global */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmitGlobalPromo)}
              className='space-y-4'
            >
              <div className='flex space-x-2'>
                <div className='flex-1'>
                  <Label htmlFor='promotionCode'>
                    Código de promoción para toda la venta{' '}
                    <span className='text-xs text-muted-foreground'>
                      *No aplica para combos
                    </span>
                  </Label>
                  <div className='flex space-x-2 mt-1'>
                    <div className='relative flex-1'>
                      <TagIcon className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                      <FormField
                        control={form.control}
                        name='promotionCode'
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                id='promotionCode'
                                placeholder='Ej: DESCUENTO20'
                                className='pl-8'
                                disabled={!!promotionCode}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    {promotionCode ? (
                      <Button
                        type='button'
                        variant='destructive'
                        onClick={handleRemoveGlobalPromotion}
                        disabled={validating}
                      >
                        <XCircle className='mr-2 h-4 w-4' />
                        Quitar
                      </Button>
                    ) : (
                      <Button
                        type='submit'
                        disabled={!form.formState.isValid || validating}
                      >
                        <PlusCircle className='mr-2 h-4 w-4' />
                        Aplicar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </Form>

          {/* Promoción por ítem */}
          {items.length > 0 && (
            <Form {...itemPromotionForm}>
              <form
                onSubmit={itemPromotionForm.handleSubmit(onSubmitItemPromo)}
                className='space-y-4'
              >
                <Label>Promoción para un producto específico</Label>
                <div className='flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2'>
                  <FormField
                    control={itemPromotionForm.control}
                    name='itemIndex'
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Seleccionar producto' />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((item, index) => (
                                <SelectItem
                                  key={index}
                                  value={index.toString()}
                                >
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className='flex space-x-2 flex-1'>
                    <FormField
                      control={itemPromotionForm.control}
                      name='promotionCode'
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormControl>
                            <Input
                              placeholder='Código de promoción'
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button
                      type='submit'
                      disabled={
                        !itemPromotionForm.formState.isValid || validating
                      }
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}

          {/* Lista de promociones por ítem aplicadas */}
          {itemPromotions.length > 0 && (
            <div className='mt-4'>
              <Label>Promociones aplicadas a productos</Label>
              <div className='border rounded-md mt-1'>
                {itemPromotions.map((promo, index) => {
                  const itemName =
                    items[promo.itemIndex]?.name ||
                    `Producto ${promo.itemIndex + 1}`
                  return (
                    <div
                      key={index}
                      className='p-2 flex justify-between items-center border-b last:border-b-0'
                    >
                      <div>
                        <span className='font-medium'>{itemName}</span>
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Código: {promo.promotionCode}
                        </span>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeItemPromotion(promo.itemIndex)}
                      >
                        <XCircle className='h-4 w-4' />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PromotionApplier
