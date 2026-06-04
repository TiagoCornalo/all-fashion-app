import {
  Warning,
  Cross,
  ChartDecreasing,
  YellowCircle,
  Package
} from '../../assets'
import { Card, CardContent } from '..'
import { Button } from '../ui/button'
import { formatDateTime } from '../../utils'

interface AlertCardProps {
  alertId: string
  type: 'NO_STOCK' | 'BELOW_MINIMUM' | 'NEAR_MINIMUM'
  message: string
  onResolve: (
    id: string,
    note: string,
    supplierId: string,
    stockType: string
  ) => void
  createdAt: string
  product?: {
    _id: string
    name: string
    code: string
    supplier?: string
    type?: string
  } | null
}

const AlertCard = ({
  alertId,
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

  const getIcon = () => {
    switch (type) {
      case 'NO_STOCK':
        return (
          <div className='flex items-center gap-2'>
            <Cross />
            <Package />
          </div>
        )
      case 'BELOW_MINIMUM':
        return (
          <div className='flex items-center gap-2'>
            <Warning />
            <ChartDecreasing />
          </div>
        )
      case 'NEAR_MINIMUM':
        return (
          <div className='flex items-center gap-2'>
            <YellowCircle />
            <Package />
          </div>
        )
    }
  }

  const handleResolve = (
    alertId: string,
    supplierId: string | undefined,
    stockType: string
  ) => {
    onResolve(alertId, '', supplierId || '', stockType)
  }

  const createdAtLabel = formatDateTime(createdAt) || 'Fecha no disponible'

  return (
    <Card className={`w-full ${getColor()} text-white`}>
      <CardContent className='flex items-center justify-between gap-4 p-4'>
        <div className='flex items-center gap-4'>
          <div className='text-2xl drop-shadow-lg'>{getIcon()}</div>
          <div className='flex flex-col'>
            <p className='font-medium'>{message}</p>
            {/* <p className='text-sm'>
              Producto: {product?.name} ({product?.code})
            </p> */}
            <p className='text-sm'>{createdAtLabel}hs</p>
          </div>
        </div>
        <Button
          variant='ghost'
          onClick={() => handleResolve(alertId, product?.supplier, type)}
          className='hover:bg-white/20'
        >
          Resolver
        </Button>
      </CardContent>
    </Card>
  )
}

export default AlertCard
