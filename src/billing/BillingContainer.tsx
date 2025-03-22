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
      <div className='flex justify-center items-center'>
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
      <div className='p-4'>
        <div className='flex items-center gap-2 mb-4'>
          {/* @ts-ignore */}
          <Receipt className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Facturación</h1>
        </div>

        {!currentRegister ? (
          <>
            <Button
              onClick={() => setIsOpenRegisterOpen(true)}
              className='bg-green-600 hover:bg-green-700'
            >
              Abrir Caja
            </Button>
            {isOpenRegisterOpen && (
              <OpenRegisterDialog
                isOpen={isOpenRegisterOpen}
                onClose={() => setIsOpenRegisterOpen(false)}
              />
            )}
          </>
        ) : (
          <Card className='space-y-4'>
            <CardHeader>
              <CardTitle>
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
                <div className='flex flex-col gap-2'>
                  <span className='text-sm text-gray-500'>
                    Abierta el:{' '}
                    {new Date(currentRegister.openedAt).toLocaleString('es-ES')}
                  </span>
                  <span className='text-sm text-gray-500'>
                    Abierta por: {currentRegister.openedBy.name}
                  </span>
                  <span className='text-sm text-gray-500'>
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
