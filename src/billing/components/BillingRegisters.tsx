import { useState } from 'react'
import { Button } from '../../components'
import BillingLastCashRegisters from './BillingLastCashRegisters'
import BillingLastSales from './BillingLastSales'
import { CardIndexDividers } from '../../assets'
import { useAuth } from '../../context/auth/useAuth'

const BillingRegisters = () => {
  const { user } = useAuth()
  const canSeeSalesHistory = ['ADMIN', 'MANAGER', 'SELLER'].includes(user?.role || '')
  const canAuditCash = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [isOpenCashRegisters, setIsOpenCashRegisters] = useState(false)
  const [isOpenLastSales, setIsOpenLastSales] = useState(false)

  const handleOpenCashRegisters = () => {
    setIsOpenCashRegisters(true)
  }

  const handleOpenLastSales = () => {
    setIsOpenLastSales(true)
  }

  return (
    <div className='p-2 sm:p-4'>
      {canSeeSalesHistory && (
        <>
          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4'>
            {/* @ts-ignore */}
            <CardIndexDividers className='h-5 w-5 sm:h-6 sm:w-6 mx-auto sm:mx-0' />
            <h1 className='text-xl sm:text-2xl font-bold text-center sm:text-left'>
              Registros
            </h1>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
            {canAuditCash && (
              <Button
                variant='outline'
                onClick={handleOpenCashRegisters}
                className='w-full h-10 sm:h-auto'
              >
                Últimas cajas
              </Button>
            )}
            <Button
              variant='outline'
              onClick={handleOpenLastSales}
              className='w-full h-10 sm:h-auto'
            >
              Últimas ventas
            </Button>
          </div>
          {isOpenCashRegisters && (
            <BillingLastCashRegisters
              isOpen={isOpenCashRegisters}
              onOpenChange={setIsOpenCashRegisters}
            />
          )}
          {isOpenLastSales && (
            <BillingLastSales
              isOpen={isOpenLastSales}
              onOpenChange={setIsOpenLastSales}
            />
          )}
        </>
      )}
    </div>
  )
}

export default BillingRegisters
