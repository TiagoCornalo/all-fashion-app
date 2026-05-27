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
import ReopenRegisterDialog from './components/ReopenRegisterDialog'
import { Button } from '../components'
import { LockOpen } from 'lucide-react'
import { useAuth } from '../context/auth/useAuth'

export default function CashRegisterContainer() {
  const { id } = useParams()
  const { user } = useAuth()
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null)
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)

  const fetchCashRegister = useCallback(async () => {
    if (!id) return
    const cashRegister = await getCashRegisterById(id)
    setCashRegister(cashRegister)
  }, [id])

  useEffect(() => {
    fetchCashRegister()
  }, [fetchCashRegister])

  const isAdmin = (user?.role as string) === 'ADMIN'
  const isClosed = cashRegister?.status === 'CLOSED'

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}
      showGoBackButton={true}
    >
      {cashRegister && (
        <div className='max-w-full overflow-hidden'>
          {isClosed && (
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 m-4 rounded-md border border-gray-300 bg-gray-50 p-3'>
              <div className='text-sm'>
                <span className='font-semibold'>Caja cerrada.</span>{' '}
                <span className='text-muted-foreground'>
                  Las ventas asociadas quedan en modo solo lectura.
                </span>
              </div>
              {isAdmin && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setReopenDialogOpen(true)}
                >
                  <LockOpen className='mr-1 h-3.5 w-3.5' />
                  Reabrir caja
                </Button>
              )}
            </div>
          )}

          <ReopenRegisterDialog
            registerId={cashRegister._id}
            isOpen={reopenDialogOpen}
            onOpenChange={setReopenDialogOpen}
            onSuccess={fetchCashRegister}
          />

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
