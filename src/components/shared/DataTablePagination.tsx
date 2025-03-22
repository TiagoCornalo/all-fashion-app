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
    <div className='flex items-center justify-end space-x-2 py-4'>
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onPageChange(currentPage - 1)
        }}
        disabled={currentPage <= 0}
      >
        Anterior
      </Button>
      <div className='text-sm'>
        Página {displayPage} de {totalPages || 1}
      </div>
      <Button
        variant='outline'
        size='sm'
        type='button'
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onPageChange(currentPage + 1)
        }}
        disabled={displayPage >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  )
}

export default DataTablePagination
