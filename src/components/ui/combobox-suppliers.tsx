import { useState, useMemo, useEffect } from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu'
import { Input } from './input'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSuppliers } from '../../services/suppliers'
import { useDebounce } from '../../hooks/useDebounce'
import { Check } from 'lucide-react'
import { Loader } from './Loader'

interface ComboboxSuppliersProps {
  value?: string
  onChange: (value: string) => void
  excludeIds?: string[]
}

export function ComboboxSuppliers({
  value,
  onChange,
  excludeIds = []
}: ComboboxSuppliersProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebounce(inputValue, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ['suppliers', debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await getSuppliers({
          search: debouncedSearch,
          page: pageParam,
          pageSize: 10
        })
        return response
      },
      getNextPageParam: (lastPage) =>
        lastPage.meta.page < lastPage.meta.totalPages
          ? lastPage.meta.page + 1
          : undefined,
      initialPageParam: 1,
      staleTime: 0,
      enabled: true
    })

  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, debouncedSearch])

  const suppliers = useMemo(() => {
    const result = data?.pages.flatMap((page) => page.data) ?? []
    return result
  }, [data])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollHeight, scrollTop, clientHeight } = target
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
  }

  const selectedSupplier = useMemo(
    () => suppliers.find((supplier) => supplier._id === value),
    [suppliers, value]
  )

  const filteredSuppliers = useMemo(() => {
    return (
      suppliers
        ?.filter((supplier) => !excludeIds.includes(supplier._id ?? ''))
        .filter((supplier) =>
          supplier.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        ) || []
    )
  }, [suppliers, debouncedSearch, excludeIds])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {selectedSupplier
            ? selectedSupplier.name
            : 'Seleccionar proveedor...'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-[--radix-dropdown-menu-trigger-width] p-0'>
        <div className='flex flex-col gap-1 p-2'>
          <Input
            type='text'
            placeholder='Buscar proveedor...'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className='h-9'
          />
          <div
            className='max-h-[300px] overflow-auto space-y-1'
            onScroll={onScroll}
          >
            {filteredSuppliers.length === 0 ? (
              <div className='text-sm text-muted-foreground text-center py-2'>
                No se encontraron proveedores.
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <DropdownMenuItem
                  key={supplier._id}
                  onSelect={() => {
                    onChange(supplier._id ?? '')
                    setOpen(false)
                  }}
                  className='flex items-start gap-2'
                >
                  {value === supplier._id && (
                    <Check className='h-4 w-4 opacity-100' />
                  )}
                  <span className='flex-grow cursor-pointer'>
                    {supplier.name}
                  </span>
                </DropdownMenuItem>
              ))
            )}
            {isFetchingNextPage && (
              <div className='flex items-center justify-center py-2'>
                <Loader className='h-4 w-4' />
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
