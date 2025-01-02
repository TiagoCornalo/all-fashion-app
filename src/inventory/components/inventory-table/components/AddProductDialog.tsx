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
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Agregar Producto</DialogTitle>
          <DialogDescription>
            Complete la información del nuevo producto
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='stock'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
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
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        {...field}
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
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
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
                  <FormLabel>Proveedor</FormLabel>
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
              >
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

export default AddProductDialog
