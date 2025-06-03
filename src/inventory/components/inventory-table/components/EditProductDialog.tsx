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
import { ComboboxSuppliers } from '../../../../components/ui/combobox-suppliers'
import { Product } from '../../../../types/inventory.types'
import { editProduct } from '../../../../services'
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
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  description: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface EditProductDialogProps {
  product: Product | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const EditProductDialog = ({
  product,
  isOpen,
  onOpenChange
}: EditProductDialogProps) => {
  const { refreshTable } = useInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      stock: 0,
      stockMinimum: 0,
      price: 0,
      supplierId: '',
      description: ''
    }
  })

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        stock: product.stock,
        stockMinimum: product.stockMinimum,
        price: product.price,
        supplierId: product.supplier._id,
        description: product.description || ''
      })
    }
  }, [product, form])

  const onSubmit = async (values: FormValues) => {
    if (!product?._id) return

    try {
      setIsSubmitting(true)
      await editProduct({
        _id: product._id,
        ...values,
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

              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm sm:text-base'>Precio</FormLabel>
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
