import { useEffect, useState } from 'react'
import LayoutMultiRole from '../layout/LayoutMultiRole'
import { useCashRegisterStore } from '../stores/cashRegisterStore'
import {
  OpenRegisterDialog,
  CloseRegisterDialog,
  NewSaleDialog
} from './components'
import { Button, Loader } from '../components'
import { PlusCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'

export default function BillingContainer() {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false)
  const { currentRegister, isLoading, fetchCurrentRegister } =
    useCashRegisterStore()

  useEffect(() => {
    const fetchRegister = async () => {
      try {
        await fetchCurrentRegister()
        console.log(currentRegister)
      } catch (error) {
        if (error instanceof Response && error.status === 404) {
          return
        }
        toast.error('Error al obtener el estado de la caja')
      }
    }
    fetchRegister()
  }, [fetchCurrentRegister])

  if (isLoading) {
    return (
      <div className='flex justify-center items-center'>
        <Loader />
      </div>
    )
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER']}>
      <div className='p-4'>
        <h1 className='text-2xl font-bold mb-4'>Facturación</h1>

        {!currentRegister ? (
          <OpenRegisterDialog />
        ) : (
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <div>
                <p>Caja actual: ${currentRegister.currentBalance}</p>
                <p>
                  Abierta el:{' '}
                  {new Date(currentRegister.openedAt).toLocaleString()}
                </p>
              </div>
              <div className='space-x-2'>
                <Button
                  onClick={() => setIsNewSaleOpen(true)}
                  className='space-x-2'
                >
                  <PlusCircle className='h-4 w-4' />
                  <span>Nueva Venta</span>
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => setIsCloseRegisterOpen(true)}
                  className='space-x-2'
                >
                  <XCircle className='h-4 w-4' />
                  <span>Cerrar Caja</span>
                </Button>
              </div>
            </div>

            <NewSaleDialog
              isOpen={isNewSaleOpen}
              onOpenChange={setIsNewSaleOpen}
            />
            <CloseRegisterDialog
              isOpen={isCloseRegisterOpen}
              onOpenChange={setIsCloseRegisterOpen}
            />
          </div>
        )}
      </div>
    </LayoutMultiRole>
  )
}
