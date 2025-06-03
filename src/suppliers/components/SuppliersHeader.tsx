import { Plus } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components'

const SuppliersHeader = ({
  onAddSupplier,
  onCreateOrder
}: {
  onAddSupplier: () => void
  onCreateOrder: () => void
}) => {
  return (
    <Card>
      <CardHeader className='pb-3 sm:pb-6'>
        <CardTitle className='text-lg sm:text-xl text-center sm:text-left'>Acciones</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col sm:flex-row gap-2 sm:gap-2'>
        <Button variant='success' size='sm' onClick={onAddSupplier} className='w-full sm:w-auto h-9 sm:h-10'>
          <Plus className='h-4 w-4 mr-2' />
          <span className='text-xs sm:text-sm'>Agregar Proveedor</span>
        </Button>
        <Button size='sm' onClick={onCreateOrder} className='w-full sm:w-auto h-9 sm:h-10'>
          <Plus className='h-4 w-4 mr-2' />
          <span className='text-xs sm:text-sm'>Crear Nueva Orden</span>
        </Button>
      </CardContent>
    </Card>
  )
}

export default SuppliersHeader
