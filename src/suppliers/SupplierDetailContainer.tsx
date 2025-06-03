import LayoutMultiRole from '../layout/LayoutMultiRole'
import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupplierById } from '../services/suppliers'
import { Loader, Tabs, TabsContent, TabsList, TabsTrigger } from '../components'
import { HandShake } from '../assets'
import { formatDateTime } from '../utils'
import SupplierDetailProductsTable from './components/supplier-details/SupplierDetailProductsTable'
import SupplierDetailOrdersTable from './components/supplier-details/SupplierDetailOrdersTable'
import SupplierDetailTransfersTable from './components/supplier-details/SupplierDetailTransfersTable'
import { Product } from '../types/inventory.types'
import DeleteProductDialog from '../inventory/components/inventory-table/components/DeleteProductDialog'
import SupplierOrderEditDialog from './components/SupplierOrderEditDialog'
import DeleteOrderDialog from './components/DeleteOrderDialog'

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
  relatedAlerts: unknown[]
  __v: number
}

const SupplierDetailContainer = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('products')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] =
    useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isEditOrderDialogOpen, setIsEditOrderDialogOpen] = useState(false)
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState(false)

  const {
    data: supplier,
    isLoading,
    error
  } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplierById(id || '')
  })

  const handleEditProduct = (product: Product) => {
    window.location.href = `/inventory/edit/${product._id}`
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteProductDialogOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsEditOrderDialogOpen(true)
  }

  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteOrderDialogOpen(true)
  }

  const handleOrderUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: ['supplierOrders']
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDateTime(new Date(dateString))
    } catch {
      return 'Fecha inválida'
    }
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabParam = searchParams.get('tab')

    if (tabParam === 'orders') {
      setActiveTab('orders')
    } else if (tabParam === 'products') {
      setActiveTab('products')
    } else if (tabParam === 'transfers') {
      setActiveTab('transfers')
    }
  }, [location.search])

  if (isLoading) {
    return (
      <LayoutMultiRole
        allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
        showGoBackButton={true}
      >
        <div className='p-4 flex justify-center'>
          <Loader />
        </div>
      </LayoutMultiRole>
    )
  }

  if (error || !supplier) {
    return (
      <LayoutMultiRole
        allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
        showGoBackButton={true}
      >
        <div className='p-4'>
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
            No se pudo cargar la información del proveedor
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton={true}
    >
      <section className='p-2 sm:p-4'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 mb-4'>
          {/* @ts-ignore */}
          <HandShake className='h-5 w-5 sm:h-6 sm:w-6' />
          <h1 className='text-xl sm:text-2xl font-bold text-center sm:text-left'>{supplier.name}</h1>
        </div>

        {/* Información del proveedor */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6'>
          <div className='bg-white p-3 sm:p-4 rounded-lg shadow'>
            <h2 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>
              Información de Contacto
            </h2>
            <div className='space-y-1 sm:space-y-2'>
              <p className='text-sm sm:text-base'>
                <span className='font-medium'>Email:</span>{' '}
                {supplier.contact.email}
              </p>
              <p className='text-sm sm:text-base'>
                <span className='font-medium'>Teléfono:</span>{' '}
                {supplier.contact.phone}
              </p>
            </div>
          </div>
          <div className='bg-white p-3 sm:p-4 rounded-lg shadow'>
            <h2 className='text-base sm:text-lg font-semibold mb-2 sm:mb-3'>Detalles Adicionales</h2>
            <div className='space-y-1 sm:space-y-2'>
              <p className='text-sm sm:text-base'>
                <span className='font-medium'>Fecha de registro:</span>{' '}
                {formatDate(supplier.createdAt)}
              </p>
              <p className='text-sm sm:text-base'>
                <span className='font-medium'>ID:</span> {supplier._id}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs para productos, órdenes y transferencias */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-4 sm:mb-6 grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 h-auto p-1 sm:p-1'>
            <TabsTrigger value='products' className='text-xs sm:text-sm h-10 w-full justify-center'>Productos</TabsTrigger>
            <TabsTrigger value='orders' className='text-xs sm:text-sm h-10 w-full justify-center'>Pedidos</TabsTrigger>
            <TabsTrigger value='transfers' className='text-xs sm:text-sm h-10 w-full justify-center'>
              Transferencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value='products' className='mt-4'>
            <SupplierDetailProductsTable
              supplierId={id || ''}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </TabsContent>

          <TabsContent value='orders' className='mt-4'>
            <SupplierDetailOrdersTable
              supplierId={id || ''}
              onEditOrder={handleEditOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          </TabsContent>

          <TabsContent value='transfers' className='mt-4'>
            <SupplierDetailTransfersTable
              supplierId={id || ''}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Diálogos para editar/eliminar */}
      {selectedProduct && (
        <DeleteProductDialog
          product={selectedProduct}
          isOpen={isDeleteProductDialogOpen}
          onOpenChange={setIsDeleteProductDialogOpen}
        />
      )}

      {selectedOrder && (
        <>
          <SupplierOrderEditDialog
            order={selectedOrder}
            isOpen={isEditOrderDialogOpen}
            onOpenChange={setIsEditOrderDialogOpen}
            onOrderUpdated={handleOrderUpdated}
          />

          <DeleteOrderDialog
            order={selectedOrder}
            isOpen={isDeleteOrderDialogOpen}
            onOpenChange={setIsDeleteOrderDialogOpen}
            onOrderDeleted={handleOrderUpdated}
          />
        </>
      )}
    </LayoutMultiRole>
  )
}

export default SupplierDetailContainer
