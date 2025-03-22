import { Badge } from '../../components/ui/badge'
import { getSaleStatusLabel, getSaleStatusColor } from './utils'

interface SaleHeaderProps {
  status: string
}

const SaleHeader = ({ status }: SaleHeaderProps) => {
  return (
    <div className='flex justify-between items-center'>
      <h1 className='text-2xl font-bold'>Detalle de Venta</h1>
      <Badge className={getSaleStatusColor(status)}>
        {getSaleStatusLabel(status)}
      </Badge>
    </div>
  )
}

export default SaleHeader
