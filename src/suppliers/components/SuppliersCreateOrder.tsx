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
  Input,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Textarea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components'
import { ComboboxSuppliers } from '../../components/ui/combobox-suppliers'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { findProductsBySupplier } from '../../services/index'
import { createOrder } from '../../services/order'
import { Product } from '../../types/inventory.types'
import { Trash } from 'lucide-react'
import SupplierProductsTable from './SupplierProductsTable'

// Esquema de validación para el formulario
const orderFormSchema = z.object({
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, 'La cantidad debe ser mayor a 0')
      })
    )
    .min(1, 'Debe agregar al menos un producto')
})

type OrderFormValues = z.infer<typeof orderFormSchema>

interface SuppliersCreateOrderProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const SuppliersCreateOrder = ({
  isOpen,
  onOpenChange
}: SuppliersCreateOrderProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState('products')

  // Estados para la tabla de productos
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [pageCount, setPageCount] = useState(0)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      supplierId: '',
      notes: '',
      items: []
    }
  })

  // Cargar productos cuando se selecciona un proveedor
  useEffect(() => {
    if (!selectedSupplierId) return

    fetchProducts()
  }, [selectedSupplierId, pagination, sorting, filters, search])

  const fetchProducts = async () => {
    if (!selectedSupplierId) return

    try {
      setIsLoadingProducts(true)
      const response = await findProductsBySupplier(selectedSupplierId, {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        ...filters
      })
      setProducts(response.data)
      setPageCount(response.meta.totalPages || 0)
    } catch (error) {
      console.error('Error al obtener productos:', error)
      toast.error('Error al cargar los productos del proveedor')
      setProducts([])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId)
    form.setValue('supplierId', supplierId)
    // Limpiar productos seleccionados cuando cambia el proveedor
    setSelectedProducts([])
    form.setValue('items', [])
  }

  const handleAddProduct = (product: Product) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      setSelectedProducts([...selectedProducts, product])
      const currentItems = form.getValues('items') || []
      form.setValue('items', [
        ...currentItems,
        {
          productId: product._id,
          quantity: 1
        }
      ])
    }
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    const items = form.getValues('items')
    const newItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    )
    form.setValue('items', newItems)
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId))
    const items = form.getValues('items')
    form.setValue(
      'items',
      items.filter((item) => item.productId !== productId)
    )
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
  }

  const handleRefresh = async () => {
    return fetchProducts()
  }

  const onSubmit = async (values: OrderFormValues) => {
    try {
      setIsSubmitting(true)
      await createOrder({
        supplierId: values.supplierId,
        items: values.items,
        notes: values.notes
      })
      toast.success('Orden creada exitosamente')
      onOpenChange(false)
      form.reset()
      setSelectedProducts([])
      setSelectedSupplierId('')
      setActiveTab('products')
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message)
      } else {
        toast.error('Error al crear la orden')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[900px] overflow-y-auto max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Crear Nueva Orden</DialogTitle>
          <DialogDescription>
            Seleccione el proveedor y los productos para la orden
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='supplierId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <ComboboxSuppliers
                      value={field.value}
                      onChange={handleSupplierChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSupplierId && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='grid w-full grid-cols-2'>
                  <TabsTrigger value='products'>Productos</TabsTrigger>
                  <TabsTrigger
                    value='order'
                    disabled={selectedProducts.length === 0}
                  >
                    Pedido ({selectedProducts.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='products' className='space-y-4'>
                  <SupplierProductsTable
                    products={products}
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
                    selectedProductIds={selectedProducts.map((p) => p._id)}
                  />
                </TabsContent>

                <TabsContent value='order' className='space-y-4'>
                  <div className='border rounded-md p-4'>
                    <h3 className='font-medium mb-4'>
                      Productos Seleccionados
                    </h3>
                    {selectedProducts.length === 0 ? (
                      <p className='text-sm text-muted-foreground'>
                        No hay productos seleccionados
                      </p>
                    ) : (
                      <div className='space-y-4'>
                        {selectedProducts.map((product) => (
                          <div
                            key={product._id}
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
                                defaultValue={1}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    product._id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                              />
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                onClick={() => handleRemoveProduct(product._id)}
                              >
                                <Trash className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                type='button'
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : 'Crear Orden'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default SuppliersCreateOrder
