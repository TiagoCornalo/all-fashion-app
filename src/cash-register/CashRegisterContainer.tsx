import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import LayoutMultiRole from '../layout/LayoutMultiRole'
import { getCashRegisterById } from '../services/cash-register'
import { CashRegister } from '../stores/cashRegisterStore'
import {
  CashRegisterDetails,
  CashRegisterResume,
  CashRegisterSales,
  CashRegisterSalesResume,
  CashRegisterOtherMovements
} from './components'

export default function CashRegisterContainer() {
  const { id } = useParams()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)

  const fetchCashRegister = useCallback(async () => {
    if (!id) return
    const cashRegister = await getCashRegisterById(id)
    setCashRegister(cashRegister)
  }, [id])

  useEffect(() => {
    fetchCashRegister()
  }, [fetchCashRegister])

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton={true}
    >
      {cashRegister && (
        <div className='max-w-full overflow-hidden'>
          <section className='p-4'>
            <CashRegisterDetails cashRegister={cashRegister} />
          </section>

          <section className='p-4 pt-1 pb-2'>
            <CashRegisterResume cashRegister={cashRegister} />
          </section>

          <section className='p-4 pt-2 pb-2'>
            <CashRegisterSales cashRegister={cashRegister} />
          </section>

          <section className='p-4 pt-2 pb-2'>
            <CashRegisterSalesResume cashRegister={cashRegister} />
          </section>

          <section className='p-4 pt-2 pb-2'>
            <CashRegisterOtherMovements cashRegister={cashRegister} />
          </section>
        </div>
      )}
    </LayoutMultiRole>
  )
}
