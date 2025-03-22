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
      <div className='p-4'>
        <Card className='w-full'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='flex items-center gap-2'>
              <Package className='h-6 w-6' />
              Gestión de Combos
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' /> Nuevo Combo
            </Button>
          </CardHeader>
          <CardContent>
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
