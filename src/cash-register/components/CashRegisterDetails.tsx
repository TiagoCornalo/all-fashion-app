import { CashRegister } from '../../stores/cashRegisterStore'
import { Bank, PushPin } from '../../assets'
import { formatDayMonth, formatDateTime } from '../../utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../components'
import { CircleCheck, CircleX } from 'lucide-react'

const CashRegisterDetails = ({
  cashRegister
}: {
  cashRegister: CashRegister
}) => {
  return (
    <div className='relative'>
      <div className='flex items-center gap-2 text-center mb-4 sm:flex-row flex-col'>
        {/* @ts-ignore */}
        <Bank className='h-6 w-6' />
        <h1 className='text-3xl font-bold'>
          Caja {formatDayMonth(new Date(cashRegister.date))}
        </h1>
      </div>

      <Card className='flex flex-col gap-4 mt-4'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-center'>
            {/* @ts-ignore */}
            <PushPin className='h-6 w-6' />
            <h1 className='text-2xl'>Detalles de la Caja</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-2 text-zinc-600'>
            <p className='text-lg flex items-center gap-2'>
              <span className='font-bold text-zinc-700'>Estado: </span>
              {cashRegister.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
              {cashRegister.status === 'OPEN' ? (
                <CircleCheck className='h-6 w-6 text-green-500 rounded-full' />
              ) : (
                <CircleX className='h-6 w-6 text-red-500 rounded-full' />
              )}
            </p>

            <p className='text-lg flex items-center gap-2'>
              <span className='font-bold text-zinc-700'>
                Fecha de apertura:{' '}
              </span>
              {formatDateTime(new Date(cashRegister.openedAt))}
            </p>

            <p className='text-lg flex items-center gap-2'>
              <span className='font-bold text-zinc-700'>Abierta por: </span>
              {cashRegister.openedBy.name}
            </p>

            {cashRegister.status === 'CLOSED' && (
              <p className='text-lg flex items-center gap-2'>
                <span className='font-bold text-zinc-700'>
                  Fecha de cierre:{' '}
                </span>
                {formatDateTime(new Date(cashRegister.closedAt || new Date()))}
              </p>
            )}

            {cashRegister.status === 'CLOSED' && (
              <p className='text-lg flex items-center gap-2'>
                <span className='font-bold text-zinc-700'>Cerrada por: </span>
                {cashRegister.closedBy?.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CashRegisterDetails
