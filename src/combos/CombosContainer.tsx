import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components'
import { useQuery } from '@tanstack/react-query'
import { getCombos } from '../services/combos'
import { ProductCombo } from '../types/combos.types'
import { Plus } from 'lucide-react'
import { LayoutMultiRole } from '../layout'
import {
  AddComboDialog,
  DeleteComboDialog,
  CombosTable,
  EditComboDialog
} from './components'
import { Package } from 'lucide-react'

const CombosContainer = () => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  })
  const [search, setSearch] = useState('')
  const [selectedCombo, setSelectedCombo] = useState<ProductCombo | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Consultar los combos con React Query
  const {
    data: combos,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['combos', pagination, sorting, search],
    queryFn: async () =>
      getCombos({
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

  const handleEdit = (combo: ProductCombo) => {
    setSelectedCombo(combo)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (combo: ProductCombo) => {
    setSelectedCombo(combo)
    setIsDeleteDialogOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']}>
      <div className='p-2 sm:p-4 lg:p-6'>
        <Card className='w-full'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 lg:p-6'>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left'>
              <Package className='h-5 w-5 sm:h-6 sm:w-6 mx-auto sm:mx-0' />
              <span className='text-lg sm:text-xl lg:text-2xl'>Gestión de Combos</span>
            </CardTitle>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              <span className="hidden sm:inline">Nuevo Combo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <CombosTable
              combos={combos?.data || []}
              pageCount={combos?.meta?.totalPages || 0}
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

      <AddComboDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onComboAdded={handleRefresh}
      />

      <EditComboDialog
        combo={selectedCombo}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onComboUpdated={handleRefresh}
      />

      <DeleteComboDialog
        combo={selectedCombo}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onComboDeleted={handleRefresh}
      />
    </LayoutMultiRole>
  )
}

export default CombosContainer
