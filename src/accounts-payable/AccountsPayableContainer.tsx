import { useState } from 'react'
import { useAuth } from '../context/auth/useAuth'
import { LayoutMultiRole } from '../layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components'
import { CreditCard, BarChart, Users, AlertTriangle, FileText } from 'lucide-react'
import { AccountsDashboard, AccountsTable, AccountReports } from './components'

/**
 * Contenedor principal para cuentas corrientes
 * Dashboard con estadísticas, lista de cuentas y reportes
 */
const AccountsPayableContainer = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Convertir role a string para la comparación
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const canAccessAccounts = isAdmin || isManager

  if (!canAccessAccounts) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              Solo administradores y managers pueden acceder a las cuentas corrientes
            </p>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'MANAGER']}
      showGoBackButton={true}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cuentas Corrientes
            </h1>
            <p className="text-gray-600">
              Gestiona las cuentas corrientes de tus clientes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cuentas
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Vencidos
            </TabsTrigger>
          </TabsList>

          {/* Dashboard con métricas y resumen */}
          <TabsContent value="dashboard" className="mt-6">
            <AccountsDashboard />
          </TabsContent>

          {/* Lista de cuentas corrientes */}
          <TabsContent value="accounts" className="mt-6">
            <AccountsTable />
          </TabsContent>

          {/* Reportes y análisis */}
          <TabsContent value="reports" className="mt-6">
            <AccountReports />
          </TabsContent>

          {/* Cuentas vencidas (filtro especial) */}
          <TabsContent value="overdue" className="mt-6">
            <AccountsTable defaultFilters={{ hasOverdue: true, status: 'OVERDUE' }} />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutMultiRole>
  )
}

export default AccountsPayableContainer