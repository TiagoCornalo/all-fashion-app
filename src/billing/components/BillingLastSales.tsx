import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../../components'
import { getSales } from '../../services/sale'
import { Sale } from '../../types/sale.types'
import { formatCurrency, formatDateTime } from '../../utils'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel
} from '@tanstack/react-table'
import { DataTablePagination } from '../../components'
import { Link } from 'react-router-dom'
import { EllipsisVertical } from 'lucide-react'

const columns: ColumnDef<Sale>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
    cell: ({ row }) => {
      return <div>{formatDateTime(new Date(row.original.createdAt))}</div>
    }
  },
  {
    accessorKey: 'invoice.type',
    header: 'Tipo',
    cell: ({ row }) => {
      const invoice = row.original.invoice
      return <div>{invoice.type}</div>
    }
  },
  {
    accessorKey: 'invoice.customerName',
    header: 'Cliente',
    cell: ({ row }) => {
      const invoice = row.original.invoice
      return <div>{invoice.customerName || 'Consumidor Final'}</div>
    }
  },
  {
    accessorKey: 'items',
    header: 'Productos',
    cell: ({ row }) => {
      const items = row.original.items
      return <div>{items.length} productos</div>
    }
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => <div>{formatCurrency(row.getValue('total'))}</div>
  },
  {
    accessorKey: 'createdBy',
    header: 'Vendedor',
    cell: ({ row }) => <div>{row.original.seller.name}</div>
  },
  {
    accessorKey: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className='cursor-pointer'>
              <Link to={`/sales/${row.original._id}`}>
                <EllipsisVertical className='h-4 w-4' />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  }
]

// Componente principal
const BillingLastSales = ({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [searchTerm, setSearchTerm] = useState('')

  const loadSales = useCallback(async () => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    try {
      const sortBy = 'createdAt'
      const sortOrder = 'desc'

      const response = await getSales(
        currentPage,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm
      )

      setSales(response.data || [])
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Error al cargar ventas:', error)
      setError('Error al cargar las ventas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [isOpen, currentPage, pageSize, searchTerm])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const table = useReactTable({
    data: sales,
    columns,
    state: {
      sorting,
      columnFilters
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true
  })

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[90vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Últimas ventas</DialogTitle>
          <DialogDescription>
            Aquí puedes ver las últimas ventas realizadas
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Barra de búsqueda */}
          <div className='flex items-center justify-between'>
            <div className='flex w-full max-w-sm items-center space-x-2'>
              <Input
                placeholder='Buscar ventas...'
                value={searchTerm}
                onChange={handleSearch}
                className='h-8'
              />
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={loadSales}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>

          {/* Tabla */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns?.length || 0}
                      className='h-24 text-center'
                    >
                      {loading
                        ? 'Cargando...'
                        : error
                        ? error
                        : 'No hay ventas registradas.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BillingLastSales
