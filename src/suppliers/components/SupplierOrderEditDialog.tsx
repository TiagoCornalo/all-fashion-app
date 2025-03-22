import { useState, useEffect } from 'react'
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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { updateOrder } from '../../services/order'
import { Trash, Plus } from 'lucide-react'
import { findProductsBySupplier } from '../../services/index'
import { Product } from '../../types/inventory.types'
import SupplierProductsTable from './SupplierProductsTable'

// Definir los tipos para las órdenes
interface OrderProduct {
  _id: string
  product: {
    _id: string
    name: string
    code: string
    price: number
  } | null
  quantity: number
  currentStock: number
  minimumStock: number
}

interface Order {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  items: OrderProduct[]
  status: 'PENDING' | 'SENT' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  notes?: string
  createdAt: string
  updatedAt: string
  createdFrom: 'MANUAL' | 'AUTO'
  totalQuantity: number
}

const orderEditSchema = z.object({
  status: z.enum(['PENDING', 'SENT', 'APPROVED', 'REJECTED', 'COMPLETED']),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1, 'La cantidad debe ser mayor a 0')
    })
  )
})

type OrderEditFormValues = z.infer<typeof orderEditSchema>

interface SupplierOrderEditDialogProps {
  order: Order | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: () => void
}

const SupplierOrderEditDialog = ({
  order,
  isOpen,
  onOpenChange,
  onOrderUpdated
}: SupplierOrderEditDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  // Estados para la tabla de productos y búsqueda
  const [products, setProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [filters] = useState<Record<string, string>>({})
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [pageCount, setPageCount] = useState(0)

  const form = useForm<OrderEditFormValues>({
    resolver: zodResolver(orderEditSchema),
    defaultValues: {
      status: 'PENDING',
      notes: '',
      items: []
    }
  })

  // Cargar productos existentes cuando se abre el diálogo
  useEffect(() => {
    if (order) {
      const orderItems = order.items.map((item) => ({
        productId: item.product?._id || '',
        quantity: item.quantity
      }))

      // Crear un arreglo de productos basado en los items del pedido
      const productsList = order.items
        .filter((item) => item.product)
        .map(
          (item) =>
            ({
              _id: item.product?._id || '',
              name: item.product?.name || '',
              code: item.product?.code || '',
              price: item.product?.price || 0,
              stock: item.currentStock,
              stockMinimum: item.minimumStock,
              supplier: order.supplier
            } as Product)
        )

      setProducts(productsList)

      form.reset({
        status: order.status as
          | 'PENDING'
          | 'SENT'
          | 'APPROVED'
          | 'REJECTED'
          | 'COMPLETED',
        notes: order.notes || '',
        items: orderItems
      })
    }
  }, [order, form])

  // Funciones para la tabla de productos
  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize }) // Actualizar el estado local

    // Hacer la petición con los nuevos valores
    fetchAvailableProducts({
      page,
      pageSize,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
      search,
      filters
    })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    // Implementar ordenamiento
    fetchAvailableProducts({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    // Implementar filtros
    fetchAvailableProducts({ filters: newFilters })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    fetchAvailableProducts({ search: value })
  }

  const handleRefresh = async () => {
    return fetchAvailableProducts({})
  }

  // Actualizamos la función para aceptar parámetros opcionales
  const fetchAvailableProducts = async ({
    page = pagination.page,
    pageSize = pagination.pageSize,
    sortBy = sorting.sortBy,
    sortOrder = sorting.sortOrder,
    search: searchTerm = search,
    filters: newFilters = filters
  } = {}) => {
    if (!order?.supplier._id) return

    try {
      setIsLoadingProducts(true)
      const response = await findProductsBySupplier(order.supplier._id, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchTerm,
        ...newFilters
      })

      // Filtramos los productos que ya están en la orden
      const currentProductIds = products.map((p) => p._id)
      const filteredProducts = response.data.filter(
        (p: Product) => !currentProductIds.includes(p._id)
      )

      setAvailableProducts(filteredProducts)
      setPageCount(response.meta?.totalPages || 0)
    } catch (error) {
      console.error('Error al obtener productos:', error)
      toast.error('Error al cargar los productos del proveedor')
      setAvailableProducts([])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleAddProduct = (product: Product) => {
    // Verificar si el producto ya está en la lista
    if (!products.find((p) => p._id === product._id)) {
      // Agregar el producto a la lista
      setProducts([...products, product])

      // Actualizar el formulario
      const currentItems = form.getValues('items') || []
      form.setValue('items', [
        ...currentItems,
        {
          productId: product._id,
          quantity: 1
        }
      ])

      // Removemos el producto de la lista de disponibles
      setAvailableProducts(
        availableProducts.filter((p) => p._id !== product._id)
      )
    }
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const items = form.getValues('items')
    items[index].quantity = quantity
    form.setValue('items', items)
  }

  const handleRemoveProduct = (index: number) => {
    const items = form.getValues('items')

    // Eliminar el producto de items
    items.splice(index, 1)
    form.setValue('items', items)

    // Eliminar el producto de la lista visual
    const updatedProducts = [...products]
    const removedProduct = updatedProducts.splice(index, 1)[0]
    setProducts(updatedProducts)

    // Si estamos mostrando productos disponibles, agregar este de nuevo a la lista
    if (showProductSearch && removedProduct) {
      setAvailableProducts([...availableProducts, removedProduct])
    }
  }

  const toggleProductSearch = () => {
    setShowProductSearch(!showProductSearch)
    if (!showProductSearch) {
      fetchAvailableProducts({})
      setSearch('')
    }
  }

  const onSubmit = async (values: OrderEditFormValues) => {
    if (!order?._id) return

    try {
      setIsSubmitting(true)
      await updateOrder(order._id, values)
      toast.success('Pedido actualizado exitosamente')
      onOrderUpdated()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data.message || 'Error al actualizar el pedido'
        )
      } else {
        toast.error('Error al actualizar el pedido')
      }
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[1200px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
          <DialogDescription>
            Actualice la información del pedido
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='details'>Detalles</TabsTrigger>
                <TabsTrigger value='products'>
                  Productos ({products.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='details' className='space-y-4'>
                <div>
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Seleccione un estado' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='PENDING'>Pendiente</SelectItem>
                            <SelectItem value='SENT'>Enviado</SelectItem>
                            <SelectItem value='APPROVED'>Aprobado</SelectItem>
                            <SelectItem value='REJECTED'>Rechazado</SelectItem>
                            <SelectItem value='COMPLETED'>
                              Completado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder='Notas adicionales para el pedido...'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='pt-2'>
                  <p className='text-sm text-muted-foreground'>
                    <strong>Proveedor:</strong> {order?.supplier.name}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    <strong>Fecha de creación:</strong>{' '}
                    {order?.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : ''}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    <strong>Origen:</strong> {order?.createdFrom}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value='products' className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <h3 className='font-medium'>Productos en el Pedido</h3>
                  <Button
                    type='button'
                    variant={showProductSearch ? 'default' : 'success'}
                    size='sm'
                    onClick={toggleProductSearch}
                  >
                    {!showProductSearch && <Plus className=' h-4 w-4' />}
                    {showProductSearch
                      ? 'Ocultar búsqueda'
                      : 'Agregar productos'}
                  </Button>
                </div>

                {/* Reemplazamos la búsqueda manual con el componente de tabla */}
                {showProductSearch && (
                  <SupplierProductsTable
                    products={availableProducts}
                    isLoading={isLoadingProducts}
                    pageCount={pageCount}
                    onPaginationChange={handlePaginationChange}
                    onSortingChange={handleSortingChange}
                    onSearchChange={handleSearchChange}
                    onFilterChange={handleFilterChange}
                    onRefresh={handleRefresh}
                    initialPage={pagination.page - 1}
                    initialPageSize={pagination.pageSize}
                    onAddProduct={handleAddProduct}
                    selectedProductIds={products.map((p) => p._id)}
                  />
                )}

                <div className='border rounded-md p-4'>
                  {products.length > 0 ? (
                    <div className='space-y-4'>
                      {products.map((product, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between gap-4 p-2 border rounded-md'
                        >
                          <div className='flex-1'>
                            <div className='font-medium'>{product.name}</div>
                            <div className='text-sm text-muted-foreground'>
                              Código: {product.code} | Stock actual:{' '}
                              {product.stock}
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <div className='text-sm'>Cantidad:</div>
                            <Input
                              type='number'
                              className='w-20'
                              min={1}
                              defaultValue={
                                form.getValues(`items.${index}.quantity`) || 1
                              }
                              onChange={(e) =>
                                handleQuantityChange(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => handleRemoveProduct(index)}
                            >
                              <Trash className='h-4 w-4' />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      No hay productos en este pedido
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                type='button'
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default SupplierOrderEditDialog
