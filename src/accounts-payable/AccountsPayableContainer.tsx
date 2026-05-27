import { useState } from 'react'
import { useAuth } from '../context/auth/useAuth'
import { LayoutMultiRole } from '../layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components'
import { CreditCard, BarChart, Users, AlertTriangle, FileText } from 'lucide-react'
import {
  AccountsDashboard,
  AccountsTable,
  AccountReports,
  InstallmentsWidgets
} from './components'

/**
 * Contenedor principal para cuentas corrientes.
 *
 * Acceso por rol:
 * - ADMIN: ve todo (Dashboard financiero, Cuentas, Reportes, Vencidos)
 * - MANAGER: ve Dashboard, Cuentas, Vencidos (sin Reportes detallados)
 * - SELLER: ve Cuentas y Vencidos (operacional). NO ve totales financieros
 *   agregados del negocio.
 *
 * Los widgets de cuotas (vencidas + próximas) se muestran arriba para todos
 * porque son operacionales y útiles para cobrar.
 */
const AccountsPayableContainer = () => {
  const { user } = useAuth()
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const isSeller = userRole === 'SELLER'

  const canSeeDashboard = isAdmin || isManager
  const canSeeReports = isAdmin
  const canAccessAccounts = isAdmin || isManager || isSeller

  // Default tab depende del rol: ADMIN/MANAGER aterrizan en dashboard,
  // SELLER va directo al listado de cuentas que es lo que va a usar.
  const [activeTab, setActiveTab] = useState(
    canSeeDashboard ? 'dashboard' : 'accounts'
  )

  if (!canAccessAccounts) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER']}>
        <div className='flex items-center justify-center min-h-screen p-4'>
          <div className='text-center'>
            <AlertTriangle className='h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-4' />
            <h2 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2'>
              Acceso Denegado
            </h2>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  const tabCount =
    1 /* accounts */ + 1 /* overdue */ + (canSeeDashboard ? 1 : 0) + (canSeeReports ? 1 : 0)
  const gridColsClass =
    tabCount === 4
      ? 'grid-cols-2 lg:grid-cols-4'
      : tabCount === 3
        ? 'grid-cols-3'
        : 'grid-cols-2'

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'MANAGER', 'SELLER']}
      showGoBackButton={true}
    >
      <div className='p-2 sm:p-4 lg:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6'>
          <CreditCard className='h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto sm:mx-0' />
          <div className='text-center sm:text-left'>
            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
              Cuentas Corrientes
            </h1>
            <p className='text-sm sm:text-base text-gray-600'>
              {isSeller
                ? 'Buscá un cliente para registrar pagos y ver cuotas pendientes'
                : 'Gestioná las cuentas corrientes de tus clientes'}
            </p>
          </div>
        </div>

        {/* Widgets de cuotas: operacionales, útiles para todos los roles */}
        <div className='mb-4 sm:mb-6'>
          <InstallmentsWidgets />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className={`grid w-full ${gridColsClass} h-auto`}>
            {canSeeDashboard && (
              <TabsTrigger
                value='dashboard'
                className='flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3'
              >
                <BarChart className='h-3 w-3 sm:h-4 sm:w-4' />
                <span className='hidden sm:inline'>Dashboard</span>
                <span className='sm:hidden'>Panel</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value='accounts'
              className='flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3'
            >
              <Users className='h-3 w-3 sm:h-4 sm:w-4' />
              Cuentas
            </TabsTrigger>
            {canSeeReports && (
              <TabsTrigger
                value='reports'
                className='flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3'
              >
                <FileText className='h-3 w-3 sm:h-4 sm:w-4' />
                Reportes
              </TabsTrigger>
            )}
            <TabsTrigger
              value='overdue'
              className='flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm p-2 sm:p-3'
            >
              <AlertTriangle className='h-3 w-3 sm:h-4 sm:w-4' />
              <span className='hidden sm:inline'>Vencidos</span>
              <span className='sm:hidden'>Venc.</span>
            </TabsTrigger>
          </TabsList>

          {canSeeDashboard && (
            <TabsContent value='dashboard' className='mt-4 sm:mt-6'>
              <AccountsDashboard />
            </TabsContent>
          )}

          <TabsContent value='accounts' className='mt-4 sm:mt-6'>
            <AccountsTable />
          </TabsContent>

          {canSeeReports && (
            <TabsContent value='reports' className='mt-4 sm:mt-6'>
              <AccountReports />
            </TabsContent>
          )}

          <TabsContent value='overdue' className='mt-4 sm:mt-6'>
            <AccountsTable defaultFilters={{ hasOverdue: true, status: 'OVERDUE' }} />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutMultiRole>
  )
}

export default AccountsPayableContainer
