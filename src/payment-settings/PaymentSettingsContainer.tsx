import LayoutAdmin from '../layout/LayoutAdmin'
import { CreditCard } from 'lucide-react'
import BanksTable from './BanksTable'
import InstallmentPlansTable from './InstallmentPlansTable'

const PaymentSettingsContainer = () => {
  return (
    <LayoutAdmin>
      <div className='space-y-4 p-2 sm:p-4'>
        <div className='flex items-center gap-2'>
          <CreditCard className='h-6 w-6' />
          <h1 className='text-2xl font-bold'>Configuración de pagos</h1>
        </div>

        <BanksTable />
        <InstallmentPlansTable />
      </div>
    </LayoutAdmin>
  )
}

export default PaymentSettingsContainer
