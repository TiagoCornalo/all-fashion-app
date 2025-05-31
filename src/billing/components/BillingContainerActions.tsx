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
  return (
    <div className='flex gap-2'>
      {/* Botón de transferencias pendientes */}
      <PendingTransfersPanel showAsDialog={true} />

      {/* Menú principal de gestión de caja */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='success'>
            <MoreVertical />
            <span>Gestionar caja</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start'>
          <DropdownMenuItem
            onSelect={() => setIsNewSaleOpen(true)}
            className='cursor-pointer text-md'
          >
            <PlusCircle className='mr-2 h-5 w-5' /> Nueva Venta
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsDepositOpen(true)}
            className='cursor-pointer text-md'
          >
            <PiggyBank className='mr-2 h-5 w-5' /> Depósito
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsWithdrawalOpen(true)}
            className='cursor-pointer text-md'
          >
            <DollarSign className='mr-2 h-5 w-5' /> Retiro
          </DropdownMenuItem>
          <DropdownMenuItem asChild className='cursor-pointer text-md'>
            <Link to={`/cash-registers/${currentRegister._id}`}>
              <Info className='mr-2 h-5 w-5' /> Detalles
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsCloseRegisterOpen(true)}
            className='cursor-pointer text-md'
          >
            <XCircle className='mr-2 h-5 w-5' /> Cerrar Caja
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default BillingContainerActions
