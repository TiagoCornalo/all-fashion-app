import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components'
import { useQuery } from '@tanstack/react-query'
import { getQuotes } from '../services/quote.service'
import { Quote } from '../types/quote.types'
import { Plus, FileText } from 'lucide-react'
import { LayoutMultiRole } from '../layout'
import {
  QuotesTable,
  CreateQuoteDialog,
  EditQuoteDialog,
  DeleteQuoteDialog,
  QuotePreviewDialog
} from './components'

const QuotesContainer = () => {
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [sorting, setSorting] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  })
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  // Consultar los remitos con React Query
  const {
    data: quotes,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['quotes', pagination, sorting, search, filters],
    queryFn: async () =>
      getQuotes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
        search,
        ...filters
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

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  const handleEdit = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsDeleteDialogOpen(true)
  }

  const handlePreview = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsPreviewDialogOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
    return Promise.resolve()
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER']}>
      <div className='p-2 sm:p-4 lg:p-6'>
        <Card className='w-full'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-3 sm:p-4 lg:p-6'>
            <CardTitle className='flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left'>
              <FileText className='h-5 w-5 sm:h-6 sm:w-6 mx-auto sm:mx-0' />
              <span className='text-lg sm:text-xl lg:text-2xl'>Gestión de Remitos y Presupuestos</span>
            </CardTitle>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
              <span className="hidden sm:inline">Nuevo Remito</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <QuotesTable
              quotes={quotes?.data || []}
              pageCount={quotes?.meta?.totalPages || 0}
              onPaginationChange={handlePaginationChange}
              onSortingChange={handleSortingChange}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onRefresh={handleRefresh}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onPreview={handlePreview}
              isLoading={isLoading}
              initialPage={pagination.page - 1}
              initialPageSize={pagination.pageSize}
            />
          </CardContent>
        </Card>
      </div>

      <CreateQuoteDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onQuoteCreated={handleRefresh}
      />

      <EditQuoteDialog
        quote={selectedQuote}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onQuoteUpdated={handleRefresh}
      />

      <DeleteQuoteDialog
        quote={selectedQuote}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onQuoteDeleted={handleRefresh}
      />

      <QuotePreviewDialog
        quote={selectedQuote}
        isOpen={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
      />
    </LayoutMultiRole>
  )
}

export default QuotesContainer