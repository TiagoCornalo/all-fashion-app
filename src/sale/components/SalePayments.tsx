import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { CreditCard } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table'
import { formatCurrency } from '../../utils'
import { getPaymentMethodLabel } from './utils'

interface SalePaymentsProps {
  payments: {
    _id: string
    method: string
    amount: number
  }[]
}

const SalePayments = ({ payments }: SalePaymentsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <CreditCard className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Pagos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='text-xs sm:text-sm'>Método</TableHead>
                <TableHead className='text-right text-xs sm:text-sm'>Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell className='text-xs sm:text-sm'>{getPaymentMethodLabel(payment.method)}</TableCell>
                  <TableCell className='text-right text-xs sm:text-sm font-medium'>
                    {formatCurrency(payment.amount)}
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

export default SalePayments
