import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DataTablePagination,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DataTableColumnHeader,
  Button
} from '../../components'
import { getCashRegisters } from '../../services/cash-register'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  ColumnDef,
  flexRender
} from '@tanstack/react-table'
import { CashRegister } from '../../stores/cashRegisterStore'
import { formatDateTime } from '../../utils'
import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'

const columns: ColumnDef<CashRegister>[] = [
  {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Fecha'
        showHideButton={false}
      />
    ),
    accessorKey: 'date',
    cell: ({ row }) => {
      return <div>{formatDateTime(new Date(row.original.date))}</div>
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Estado'
        showHideButton={false}
      />
    ),
    cell: ({ row }) => {
      return (
        <div>
          {row.original.status === 'OPEN' ? (
            <Badge variant='success'>Abierta</Badge>
          ) : (
            <Badge variant='error'>Cerrada</Badge>
          )}
        </div>
      )
    }
  },
  {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Balance Inicial'
        showHideButton={false}
      />
    ),
    accessorKey: 'initialBalance',
    cell: ({ row }) => {
      return <div>{row.original.initialBalance}</div>
    }
  },
  {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Balance Actual'
        showHideButton={false}
      />
    ),
    accessorKey: 'currentBalance',
    cell: ({ row }) => {
      return <div>{row.original.currentBalance}</div>
    }
  },
  {
    header: 'Cerrada por',
    accessorKey: 'closedBy',
    cell: ({ row }) => {
      return <div>{row.original.closedBy?.name}</div>
    }
  },
  {
    header: 'Abierta por',
    accessorKey: 'openedBy',
    cell: ({ row }) => {
      return <div>{row.original.openedBy?.name}</div>
    }
  },
  {
    header: 'Acciones',
    accessorKey: 'actions',
    cell: ({ row }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className='cursor-pointer'>
              <Link to={`/cash-registers/${row.original._id}`}>
                <Button variant='outline' size='sm'>
                  <Eye className='h-4 w-4' />
                </Button>
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

const BillingLastCashRegisters = ({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const loadCashRegisters = useCallback(async () => {
    if (!isOpen) return

    setLoading(true)
    setError(null)

    try {
      const sortField = sorting.length > 0 ? sorting[0].id : 'date'
      const sortDirection =
        sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'

      const response = await getCashRegisters(
        currentPage,
        pageSize,
        sortField,
        sortDirection
      )

      setCashRegisters(response.data || [])
      setTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Error al cargar cajas:', error)
      setError('Error al cargar las cajas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [isOpen, currentPage, pageSize, sorting])

  useEffect(() => {
    loadCashRegisters()
  }, [loadCashRegisters])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const table = useReactTable({
    data: cashRegisters,
    columns,
    state: {
      sorting,
      columnFilters
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
    },
    onColumnFiltersChange: setColumnFilters,
    manualPagination: true,
    manualSorting: true
  })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[90vw] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Últimas cajas</DialogTitle>
          <DialogDescription>
            Aquí puedes ver las últimas cajas
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
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

export default BillingLastCashRegisters
