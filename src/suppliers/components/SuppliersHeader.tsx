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
      <CardHeader>
        <CardTitle>Acciones</CardTitle>
      </CardHeader>
      <CardContent className='flex gap-2'>
        <Button variant='success' size='sm' onClick={onAddSupplier}>
          <Plus className='h-4 w-4' />
          Agregar Proveedor
        </Button>
        <Button size='sm' onClick={onCreateOrder}>
          <Plus className='h-4 w-4' />
          Crear Nueva Orden
        </Button>
      </CardContent>
    </Card>
  )
}

export default SuppliersHeader
