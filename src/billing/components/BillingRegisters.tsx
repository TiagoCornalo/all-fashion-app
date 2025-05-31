import { useState } from 'react'
import { Button } from '../../components'
import BillingLastCashRegisters from './BillingLastCashRegisters'
import BillingLastSales from './BillingLastSales'
import { CardIndexDividers } from '../../assets'
import { useAuth } from '../../context/auth/useAuth'

const BillingRegisters = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [isOpenCashRegisters, setIsOpenCashRegisters] = useState(false)
  const [isOpenLastSales, setIsOpenLastSales] = useState(false)

  const handleOpenCashRegisters = () => {
    setIsOpenCashRegisters(true)
  }

  const handleOpenLastSales = () => {
    setIsOpenLastSales(true)
  }

  return (
    <div className='p-4'>
      {isAdmin && <>
        <div className='flex items-center gap-2 mb-4'>
          {/* @ts-ignore */}
          <CardIndexDividers className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Registros</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <Button variant='outline' onClick={handleOpenCashRegisters}>
            Ultimas cajas
          </Button>
          <Button variant='outline' onClick={handleOpenLastSales}>
            Ultimas ventas
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
      </>}
    </div>
  )
}

export default BillingRegisters
