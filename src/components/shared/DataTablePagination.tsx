import { Button } from '../ui/button'

const DataTablePagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number // Esto es en base 0 (de TanStack Table)
  totalPages: number
  onPageChange: (page: number) => void // Esto espera base 0
}) => {
  // Para mostrar al usuario, usamos base 1
  const displayPage = currentPage + 1

  return (
    <div className='flex flex-wrap items-center justify-end gap-2 py-3 sm:py-4'>
      <Button
        variant='outline'
        size='sm'
        type='button'
        className='h-9 sm:h-8'
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onPageChange(currentPage - 1)
        }}
        disabled={currentPage <= 0}
      >
        <span className='sm:hidden'>‹</span>
        <span className='hidden sm:inline'>Anterior</span>
      </Button>
      <div className='text-xs sm:text-sm whitespace-nowrap'>
        <span className='sm:hidden'>{displayPage}/{totalPages || 1}</span>
        <span className='hidden sm:inline'>Página {displayPage} de {totalPages || 1}</span>
      </div>
      <Button
        variant='outline'
        size='sm'
        type='button'
        className='h-9 sm:h-8'
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onPageChange(currentPage + 1)
        }}
        disabled={displayPage >= totalPages}
      >
        <span className='sm:hidden'>›</span>
        <span className='hidden sm:inline'>Siguiente</span>
      </Button>
    </div>
  )
}

export default DataTablePagination
