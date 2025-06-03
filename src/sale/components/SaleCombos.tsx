import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Package } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table'
import { formatCurrency } from '../../utils'

interface SaleCombosProps {
  combos: {
    _id: string
    comboId: string
    name: string
    code: string
    quantity: number
    originalPrice: number
    totalPrice: number
  }[]
}

const SaleCombos = ({ combos }: SaleCombosProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <Package className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Combos Aplicados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-xs sm:text-sm'>Código</TableHead>
                <TableHead className='text-xs sm:text-sm'>Combo</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Cantidad</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Precio</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combos.map((combo) => (
                <TableRow key={combo._id}>
                  <TableCell className='font-medium text-xs sm:text-sm'>{combo.code}</TableCell>
                  <TableCell className='text-xs sm:text-sm'>
                    <div className='min-w-0 truncate'>{combo.name}</div>
                  </TableCell>
                  <TableCell className='text-right text-xs sm:text-sm'>{combo.quantity}</TableCell>
                  <TableCell className='text-right text-xs sm:text-sm'>
                    {formatCurrency(combo.originalPrice)}
                  </TableCell>
                  <TableCell className='text-right text-xs sm:text-sm font-medium'>
                    {formatCurrency(combo.totalPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default SaleCombos
