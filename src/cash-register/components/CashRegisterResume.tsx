import { Card, CardContent, CardHeader, CardTitle } from '../../components'
import { MoneyBag } from '../../assets'
import { CashRegister } from '../../stores/cashRegisterStore'
import { formatCurrency } from '../../utils'

const CashRegisterResume = ({
  cashRegister
}: {
  cashRegister: CashRegister
}) => {
  const totalSales = cashRegister.movements
    .filter((movement) => movement.type === 'SALE')
    .reduce((sum, movement) => sum + movement.amount, 0)

  const summaryData = [
    {
      concept: 'Balance Inicial',
      amount: cashRegister.initialBalance
    },
    {
      concept: 'Total Ventas',
      amount: totalSales
    },
    {
      concept: 'Depósitos',
      amount: cashRegister.movements
        .filter((movement) => movement.type === 'DEPOSIT')
        .reduce((sum, movement) => sum + movement.amount, 0)
    },
    {
      concept: 'Extracciones',
      amount: cashRegister.movements
        .filter((movement) => movement.type === 'WITHDRAWAL')
        .reduce((sum, movement) => sum + movement.amount, 0)
    },
    {
      concept: 'Balance Actual',
      amount: cashRegister.currentBalance
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-center'>
          {/* @ts-ignore */}
          <MoneyBag className='h-6 w-6' />
          <h1 className='text-2xl'>Resumen de Caja</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b'>
                <th className='py-2 px-4 text-left font-medium'>Concepto</th>
                <th className='py-2 px-4 text-right font-medium'>Monto</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    index === summaryData.length - 1 ? 'font-bold' : ''
                  }`}
                >
                  <td className='py-2 px-4 text-left'>{item.concept}</td>
                  <td className='py-2 px-4 text-right'>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export default CashRegisterResume
