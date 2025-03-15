import { Button } from '../ui/button'

const DataTablePagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => {
  return (
    <div className='flex items-center justify-end space-x-2 py-4'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Anterior
      </Button>
      <div className='text-sm'>
        Página {currentPage} de {totalPages}
      </div>
      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Siguiente
      </Button>
    </div>
  )
}

export default DataTablePagination
