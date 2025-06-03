import { useEffect, useState } from 'react'
import LayoutMultiRole from '../layout/LayoutMultiRole'
import { useCashRegisterStore } from '../stores/cashRegisterStore'
import {
  OpenRegisterDialog,
  CloseRegisterDialog,
  NewSaleDialog,
  BillingRegisters,
  BillingContainerActions,
  DepositDialog,
  WithdrawalDialog
} from './components'
import {
  Button,
  Loader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '../components'
import { toast } from 'react-toastify'
import { Receipt } from '../assets'
import { formatCurrency } from '../utils'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function BillingContainer() {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false)
  const [isCloseRegisterOpen, setIsCloseRegisterOpen] = useState(false)
  const [isOpenRegisterOpen, setIsOpenRegisterOpen] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
  const { currentRegister, isLoading, fetchCurrentRegister } =
    useCashRegisterStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRegister = async () => {
      try {
        await fetchCurrentRegister()

        const newSale = searchParams.get('new') === 'true'
        if (newSale) {
          navigate('/billing', { replace: true })
          setIsNewSaleOpen(true)
        }
      } catch (error) {
        if (error instanceof Response && error.status === 404) {
          if (searchParams.get('new') === 'true') {
            toast.error('Primero debes abrir una caja para realizar una venta')
            setIsOpenRegisterOpen(true)
            navigate('/billing', { replace: true })
          }
          return
        }
        toast.error('Error al obtener el estado de la caja')
      }
    }
    fetchRegister()
  }, [fetchCurrentRegister, searchParams, navigate])

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader />
      </div>
    )
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'SELLER', 'MANAGER']}>
      <div className='space-y-4 p-2 sm:p-4'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4'>
          {/* @ts-ignore */}
          <Receipt className='h-6 w-6 sm:h-8 sm:w-8 mx-auto sm:mx-0' />
          <h1 className='text-2xl sm:text-3xl font-bold text-center sm:text-left'>
            Facturación
          </h1>
        </div>

        {!currentRegister ? (
          <div className='space-y-4'>
            <Button
              onClick={() => setIsOpenRegisterOpen(true)}
              className='bg-green-600 hover:bg-green-700 w-full sm:w-auto'
            >
              Abrir Caja
            </Button>
            {isOpenRegisterOpen && (
              <OpenRegisterDialog
                isOpen={isOpenRegisterOpen}
                onClose={() => setIsOpenRegisterOpen(false)}
              />
            )}
          </div>
        ) : (
          <Card className='space-y-4'>
            <CardHeader>
              <CardTitle className='text-lg sm:text-xl'>
                Balance actual:{' '}
                <span
                  className={`${getBalanceColor(
                    currentRegister.currentBalance
                  )} font-bold`}
                >
                  {formatCurrency(currentRegister.currentBalance)}
                </span>
              </CardTitle>
              <CardDescription>
                <div className='flex flex-col gap-2 text-sm'>
                  <span className='text-gray-500'>
                    Abierta el:{' '}
                    {new Date(currentRegister.openedAt).toLocaleString('es-ES')}
                  </span>
                  <span className='text-gray-500'>
                    Abierta por: {currentRegister.openedBy.name}
                  </span>
                  <span className='text-gray-500'>
                    Ultima venta:{' '}
                    {currentRegister.movements.length > 0
                      ? new Date(
                        currentRegister.movements[
                          currentRegister.movements.length - 1
                        ].createdAt
                      ).toLocaleString('es-ES')
                      : 'N/A'}
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingContainerActions
                setIsNewSaleOpen={setIsNewSaleOpen}
                setIsCloseRegisterOpen={setIsCloseRegisterOpen}
                setIsDepositOpen={setIsDepositOpen}
                setIsWithdrawalOpen={setIsWithdrawalOpen}
                currentRegister={currentRegister}
              />
            </CardContent>

            <NewSaleDialog
              isOpen={isNewSaleOpen}
              onOpenChange={setIsNewSaleOpen}
            />
            <CloseRegisterDialog
              isOpen={isCloseRegisterOpen}
              onOpenChange={setIsCloseRegisterOpen}
            />
            <DepositDialog
              isOpen={isDepositOpen}
              onOpenChange={setIsDepositOpen}
            />
            <WithdrawalDialog
              isOpen={isWithdrawalOpen}
              onOpenChange={setIsWithdrawalOpen}
            />
          </Card>
        )}
      </div>

      <BillingRegisters />
    </LayoutMultiRole>
  )
}
