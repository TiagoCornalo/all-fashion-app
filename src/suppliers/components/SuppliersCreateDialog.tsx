import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
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
  FormMessage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { createSupplier } from '../../services/suppliers'

const supplierFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  contact: z.object({
    email: z.string().email('Email inválido'),
    phone: z.string().min(1, 'El teléfono es requerido')
  })
})

type SupplierFormValues = z.infer<typeof supplierFormSchema>

interface SuppliersCreateDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSupplierCreated: () => void
}

const SuppliersCreateDialog = ({
  isOpen,
  onOpenChange,
  onSupplierCreated
}: SuppliersCreateDialogProps) => {
  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contact: {
        email: '',
        phone: ''
      }
    }
  })

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      setIsSubmitting(true)
      await createSupplier(values)
      toast.success('Proveedor creado exitosamente')
      onOpenChange(false)
      onSupplierCreated()
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message)
      } else {
        toast.error('Error al crear el proveedor')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-md sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl'>Crear Nuevo Proveedor</DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Ingrese la información del proveedor
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2 mb-3 sm:mb-4'>
            <TabsTrigger value='basic' className='text-xs sm:text-sm'>Información Básica</TabsTrigger>
            <TabsTrigger value='products' className='text-xs sm:text-sm'>Productos</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4'>
              <TabsContent value='basic' className='space-y-3 sm:space-y-4'>
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
                        <Input {...field} className='h-9 sm:h-10' />
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
              </TabsContent>
              <TabsContent value='products' className='space-y-3 sm:space-y-4'>
                <div className='space-y-4'>
                  <p className='text-xs sm:text-sm text-muted-foreground text-center'>
                    Podrá agregar productos después de crear el proveedor
                  </p>
                </div>
              </TabsContent>

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
                  {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default SuppliersCreateDialog
