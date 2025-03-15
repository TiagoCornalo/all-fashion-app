import { useState } from 'react'
import { Button } from '../../components'
import BillingLastCashRegisters from './BillingLastCashRegisters'
import BillingLastSales from './BillingLastSales'

const BillingRegisters = () => {
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
      <h1 className='text-2xl font-bold mb-4'>Registros</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <Button variant='outline' onClick={handleOpenCashRegisters}>
          Ultimas cajas cerradas
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
    </div>
  )
}

export default BillingRegisters
