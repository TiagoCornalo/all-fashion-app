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
}

const SuppliersCreateDialog = ({
  isOpen,
  onOpenChange
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
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
          <DialogDescription>
            Ingrese la información del proveedor
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='basic'>Información Básica</TabsTrigger>
            <TabsTrigger value='products'>Productos</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <TabsContent value='basic'>
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
                <FormField
                  control={form.control}
                  name='contact.email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value='products'>
                <div className='space-y-4'>
                  <p className='text-sm text-muted-foreground'>
                    Podrá agregar productos después de crear el proveedor
                  </p>
                </div>
              </TabsContent>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  type='button'
                >
                  Cancelar
                </Button>
                <Button type='submit' disabled={isSubmitting}>
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
