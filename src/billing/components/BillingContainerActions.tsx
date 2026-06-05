import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button
} from '../../components'
import { CashRegister } from '../../stores/cashRegisterStore'
import {
  MoreVertical,
  PlusCircle,
  DollarSign,
  XCircle,
  Info,
  PiggyBank
} from 'lucide-react'
import { Link } from 'react-router-dom'
import PendingTransfersPanel from '../../components/transfers/PendingTransfersPanel'
import { useAuth } from '../../context/auth/useAuth'

const BillingContainerActions = ({
  setIsNewSaleOpen,
  setIsDepositOpen,
  setIsWithdrawalOpen,
  setIsCloseRegisterOpen,
  currentRegister
}: {
  setIsNewSaleOpen: (open: boolean) => void
  setIsDepositOpen: (open: boolean) => void
  setIsWithdrawalOpen: (open: boolean) => void
  setIsCloseRegisterOpen: (open: boolean) => void
  currentRegister: CashRegister
}) => {
  const { user } = useAuth()
  const canSeeTransfers = ['ADMIN', 'MANAGER', 'SELLER'].includes(user?.role || '')
  const canAuditCash = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  return (
    <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
      {/* Botón de transferencias pendientes - roles administrativos */}
      {canSeeTransfers && (
        <div className='w-full sm:w-auto'>
          <PendingTransfersPanel showAsDialog={true} />
        </div>
      )}

      {/* Menú principal de gestión de caja */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='success' className='w-full sm:w-auto'>
            <MoreVertical className='sm:mr-0 mr-2' />
            <span className='sm:hidden'>Gestionar caja</span>
            <span className='hidden sm:inline'>Gestionar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-56'>
          <DropdownMenuItem
            onSelect={() => setIsNewSaleOpen(true)}
            className='cursor-pointer text-sm sm:text-md'
          >
            <PlusCircle className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> Nueva Venta
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDepositOpen(true)}
            className='cursor-pointer text-sm sm:text-md'
          >
            <PiggyBank className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> Depósito
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsWithdrawalOpen(true)}
            className='cursor-pointer text-sm sm:text-md'
          >
            <DollarSign className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> Retiro
          </DropdownMenuItem>
          {canAuditCash && (
            <DropdownMenuItem asChild className='cursor-pointer text-sm sm:text-md'>
              <Link to={`/cash-registers/${currentRegister._id}`}>
                <Info className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> Detalles
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() => setIsCloseRegisterOpen(true)}
            className='cursor-pointer text-sm sm:text-md'
          >
            <XCircle className='mr-2 h-4 w-4 sm:h-5 sm:w-5' /> Cerrar Caja
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default BillingContainerActions
