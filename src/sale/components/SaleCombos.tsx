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
        <CardTitle className='flex items-center'>
          <Package className='mr-2 h-5 w-5' />
          Combos Aplicados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Combo</TableHead>
                <TableHead className='text-right'>Cantidad</TableHead>
                <TableHead className='text-right'>Precio</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combos.map((combo) => (
                <TableRow key={combo._id}>
                  <TableCell className='font-medium'>{combo.code}</TableCell>
                  <TableCell>{combo.name}</TableCell>
                  <TableCell className='text-right'>{combo.quantity}</TableCell>
                  <TableCell className='text-right'>
                    {formatCurrency(combo.originalPrice)}
                  </TableCell>
                  <TableCell className='text-right'>
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
