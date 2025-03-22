import LayoutMultiRole from '../layout/LayoutMultiRole'
import { HandShake } from '../assets'
import {
  SuppliersHeader,
  SuppliersTable,
  SuppliersCreateDialog,
  SuppliersCreateOrder
} from './components'
import { getSuppliers } from '../services/suppliers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components'
import SuppliersOrders from './components/SuppliersOrders'
import SuppliersEditDialog from './components/SuppliersEditDialog'
import DeleteSupplierDialog from './components/DeleteSupplierDialog'
import { Supplier } from '../types/inventory.types'

const SuppliersContainer = () => {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10
  })
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<{
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }>({})
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [isOpenAddSupplier, setIsOpenAddSupplier] = useState(false)
  const [isOpenCreateOrder, setIsOpenCreateOrder] = useState(false)
  const [activeTab, setActiveTab] = useState('suppliers')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  )
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: suppliers, isLoading } = useQuery({
    queryKey: [
      'suppliers',
      pagination.page,
      pagination.pageSize,
      search,
      sorting,
      filters
    ],
    queryFn: () =>
      getSuppliers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search,
        ...sorting,
        filters
      })
  })

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSortingChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSorting({ sortBy, sortOrder })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ['suppliers']
      })
      return Promise.resolve()
    } catch (error) {
      console.error('Error al refrescar datos:', error)
      return Promise.reject(error)
    }
  }

  const handleAddSupplier = () => {
    setIsOpenAddSupplier(true)
  }

  const handleCreateOrder = () => {
    setIsOpenCreateOrder(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsDeleteDialogOpen(true)
  }

  const handleSupplierUpdated = () => {
    queryClient.invalidateQueries({
      queryKey: ['suppliers']
    })
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN']}>
      <section className='p-4'>
        <div className='flex items-center gap-2 mb-4'>
          {/* @ts-ignore */}
          <HandShake className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Proveedores</h1>
        </div>
      </section>
      <section className='p-4'>
        <SuppliersHeader
          onAddSupplier={handleAddSupplier}
          onCreateOrder={handleCreateOrder}
        />
      </section>
      <section className='p-4'>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='mb-4'>
            <TabsTrigger value='suppliers'>Proveedores</TabsTrigger>
            <TabsTrigger value='orders'>Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value='suppliers'>
            <SuppliersTable
              suppliers={suppliers?.data}
              isLoading={isLoading}
              pageCount={suppliers?.meta.totalPages || 0}
              onPaginationChange={handlePaginationChange}
              onSortingChange={handleSortingChange}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onRefresh={handleRefresh}
              initialPage={pagination.page - 1}
              initialPageSize={pagination.pageSize}
              onEdit={handleEditSupplier}
              onDelete={handleDeleteSupplier}
            />
          </TabsContent>

          <TabsContent value='orders'>
            <SuppliersOrders />
          </TabsContent>
        </Tabs>
      </section>

      <SuppliersCreateDialog
        isOpen={isOpenAddSupplier}
        onOpenChange={setIsOpenAddSupplier}
      />
      <SuppliersCreateOrder
        isOpen={isOpenCreateOrder}
        onOpenChange={setIsOpenCreateOrder}
      />

      {selectedSupplier && (
        <>
          <SuppliersEditDialog
            supplier={selectedSupplier}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSupplierUpdated={handleSupplierUpdated}
          />

          <DeleteSupplierDialog
            supplier={selectedSupplier}
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onSupplierDeleted={handleSupplierUpdated}
          />
        </>
      )}
    </LayoutMultiRole>
  )
}

export default SuppliersContainer
