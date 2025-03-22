import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components'
import { useQuery } from '@tanstack/react-query'
import { getDiscounts } from '../services/discounts'
import { Discount } from '../types/discount.types'
import { Plus } from 'lucide-react'
import { LayoutMultiRole } from '../layout'
import {
  AddDiscountDialog,
  DeleteDiscountDialog,
  DiscountsTable,
  EditDiscountDialog
} from './components'
import { Label } from '../assets'

const DiscountsContainer = () => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [search, setSearch] = useState('')
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null
  )
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Consultar los descuentos con React Query
  const {
    data: discounts,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['discounts', pagination, sorting, search],
    queryFn: async () =>
      getDiscounts({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search
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
  }

  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (discount: Discount) => {
    setSelectedDiscount(discount)
    setIsDeleteDialogOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']}>
      <div className='p-4'>
        <Card className='w-full'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              {/* @ts-ignore */}
              <Label className='h-6 w-6' />
              Gestión de Descuentos
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> Nuevo Descuento
            </Button>
          </CardHeader>
          <CardContent>
            <DiscountsTable
              discounts={discounts?.data || []}
              pageCount={discounts?.meta?.totalPages || 0}
              onPaginationChange={handlePaginationChange}
              onSortingChange={handleSortingChange}
              onSearchChange={handleSearchChange}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
              initialPage={pagination.page - 1}
              initialPageSize={pagination.pageSize}
            />
          </CardContent>
        </Card>
      </div>

      <AddDiscountDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onDiscountAdded={handleRefresh}
      />

      <EditDiscountDialog
        discount={selectedDiscount}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onDiscountUpdated={handleRefresh}
      />

      <DeleteDiscountDialog
        discount={selectedDiscount}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDiscountDeleted={handleRefresh}
      />
    </LayoutMultiRole>
  )
}

export default DiscountsContainer
