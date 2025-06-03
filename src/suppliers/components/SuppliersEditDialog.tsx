import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../components'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { updateSupplier } from '../../services/suppliers'
import { Supplier } from '../../types/inventory.types'

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  contact: z.object({
    email: z
      .string()
      .email('Formato de email inválido')
      .min(1, 'El email es requerido'),
    phone: z.string().min(1, 'El teléfono es requerido')
  })
})

type FormValues = z.infer<typeof formSchema>

interface SuppliersEditDialogProps {
  supplier: Supplier | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSupplierUpdated: () => void
}

const SuppliersEditDialog = ({
  supplier,
  isOpen,
  onOpenChange,
  onSupplierUpdated
}: SuppliersEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact: {
        email: '',
        phone: ''
      }
    }
  })

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        contact: {
          email: supplier.contact.email,
          phone: supplier.contact.phone
        }
      })
    }
  }, [supplier, form])

  const onSubmit = async (values: FormValues) => {
    if (!supplier?._id) return

    try {
      setIsSubmitting(true)

      const updatedSupplier: Supplier = {
        _id: supplier._id,
        name: values.name,
        contact: values.contact,
        createdAt: supplier.createdAt,
        updatedAt: new Date().toISOString()
      }

      await updateSupplier(supplier._id, updatedSupplier)
      toast.success('Proveedor actualizado exitosamente')
      onSupplierUpdated()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || 'Error al actualizar el proveedor'
        )
      } else {
        toast.error('Error al actualizar el proveedor')
      }
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-md sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Editar Proveedor</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Modifique la información del proveedor
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
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

            <FormField
              control={form.control}
              name='contact.email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Email</FormLabel>
                  <FormControl>
                    <Input type='email' {...field} className='h-9 sm:h-10' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='contact.phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} className='h-9 sm:h-10' />
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
              <Button type='submit' disabled={isSubmitting} className='w-full sm:w-auto h-9 sm:h-10'>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default SuppliersEditDialog
