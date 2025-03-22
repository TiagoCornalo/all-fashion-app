import { Card, CardContent, CardHeader, CardTitle } from '../../components'
import { CreditCard } from '../../assets'
import { CashRegister } from '../../stores/cashRegisterStore'
import { formatCurrency } from '../../utils'

const CashRegisterSalesResume = ({
  cashRegister
}: {
  cashRegister: CashRegister
}) => {
  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: 'Efectivo',
      CREDIT: 'Crédito',
      DEBIT: 'Débito',
      TRANSFER: 'Transferencia'
    }
    return labels[method] || method
  }

  const getOperationsText = (count: number) => {
    return count === 1 ? 'operación' : 'operaciones'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-center'>
          {/* @ts-ignore */}
          <CreditCard className='h-6 w-6' />
          <h1 className='text-2xl'>Resumen de Pagos</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b'>
                <th className='py-2 px-4 text-left font-medium'>Método</th>
                <th className='py-2 px-4 text-left font-medium'>Cantidad</th>
                <th className='py-2 px-4 text-right font-medium'>
                  Monto total
                </th>
              </tr>
            </thead>
            <tbody>
              {cashRegister.paymentSummary &&
              cashRegister.paymentSummary.length > 0 ? (
                cashRegister.paymentSummary.map((payment, index) => (
                  <tr key={index} className='border-b'>
                    <td className='py-2 px-4 text-left'>
                      {getPaymentMethodLabel(payment.method)}
                    </td>
                    <td className='py-2 px-4 text-left'>
                      {payment.count} {getOperationsText(payment.count)}
                    </td>
                    <td className='py-2 px-4 text-right'>
                      {formatCurrency(payment.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className='py-4 text-center text-gray-500'>
                    No hay datos de pagos disponibles
                  </td>
                </tr>
              )}

              {cashRegister.paymentSummary &&
                cashRegister.paymentSummary.length > 0 && (
                  <tr className='font-bold'>
                    <td className='py-2 px-4 text-left'>Total</td>
                    <td className='py-2 px-4 text-left'>
                      {cashRegister.paymentSummary.reduce(
                        (sum, payment) => sum + payment.count,
                        0
                      )}{' '}
                      operaciones
                    </td>
                    <td className='py-2 px-4 text-right'>
                      {formatCurrency(
                        cashRegister.paymentSummary.reduce(
                          (sum, payment) => sum + payment.total,
                          0
                        )
                      )}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default CashRegisterSalesResume
