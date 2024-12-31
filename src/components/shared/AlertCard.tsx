import { Warning } from '../../assets'
import { Card, CardContent } from '..'
import { Button } from '../ui/button'
import { formatDateTime } from '../../utils'

interface AlertCardProps {
  type: 'NO_STOCK' | 'BELOW_MINIMUM' | 'NEAR_MINIMUM'
  message: string
  onResolve: (id: string, note: string) => void
  createdAt: string
  product: {
    _id: string
    name: string
    code: string
  }
}

const AlertCard = ({
  type,
  message,
  onResolve,
  createdAt,
  product
}: AlertCardProps) => {
  const getColor = () => {
    switch (type) {
      case 'NO_STOCK':
        return 'bg-red-400'
      case 'BELOW_MINIMUM':
        return 'bg-yellow-400'
      case 'NEAR_MINIMUM':
        return 'bg-green-400'
      default:
        return 'bg-gray-400'
    }
  }

  const handleResolve = (productId: string) => {
    // Por ahora pasamos una nota vacía, podrías agregar un modal para capturar la nota
    onResolve(productId, '')
  }

  return (
    <Card className={`w-full ${getColor()} text-white`}>
      <CardContent className='flex items-center justify-between gap-4 p-4'>
        <div className='flex items-center gap-4'>
          <div className='text-2xl drop-shadow-lg'>
            <Warning />
          </div>
          <div className='flex flex-col'>
            <p className='font-medium'>{message}</p>
            <p className='text-sm'>
              Producto: {product?.name} ({product?.code})
            </p>
            <p className='text-sm'>{formatDateTime(new Date(createdAt))}hs</p>
          </div>
        </div>
        <Button
          variant='ghost'
          onClick={() => handleResolve(product?._id)}
          className='hover:bg-white/20'
        >
          Resolver
        </Button>
      </CardContent>
    </Card>
  )
}

export default AlertCard
