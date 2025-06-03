import { useState } from 'react'
import { useInventory } from '../../../context/InventoryContext'
import {
  Dialog,
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
} from '../../../../components'
import { ComboboxSuppliers } from '../../../../components/ui/combobox-suppliers'
import { addProduct } from '../../../../services'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { AxiosError } from 'axios'

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  stock: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  stockMinimum: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val || 0)),
  price: z.union([z.string(), z.number()]).transform((val) => Number(val || 0)),
  supplierId: z.string().min(1, 'El proveedor es requerido')
})

type FormValues = z.infer<typeof formSchema>

interface AddProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const AddProductDialog = ({ isOpen, onOpenChange }: AddProductDialogProps) => {
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
      supplierId: ''
    }
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await addProduct({
        ...values,
        description: '',
        supplier: {
          _id: values.supplierId,
          name: '',
          contact: { email: '', phone: '' }
        }
      })
      onOpenChange(false)
      form.reset()
      refreshTable()
      toast.success('Producto agregado correctamente')
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(
          `Error al agregar el producto: ${error.response?.data?.details}`
        )
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

export default AddProductDialog
