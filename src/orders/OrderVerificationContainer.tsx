import { useState } from 'react'
import { useAuth } from '../context/auth/useAuth'
import { LayoutMultiRole } from '../layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components'
import { Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { ScheduledOrdersList } from './components/verification'
import { ArrivedOrdersList } from './components/verification'
import { PendingApprovalList } from './components/verification'
import { VerifiedOrders } from './components/verification'

/**
 * Contenedor principal para el flujo de verificación de pedidos
 * Incluye tabs para diferentes etapas del proceso según el rol del usuario
 */
const OrderVerificationContainer = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('scheduled')

  // Convertir role a string para la comparación
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'
  const isManager = userRole === 'MANAGER'
  const canApprove = isAdmin || isManager

  return (
    <LayoutMultiRole
      allowedRoles={['ADMIN', 'MANAGER', 'SELLER']}
      showGoBackButton={true}
    >
      <div className="p-2 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">
              Verificación de Pedidos
            </h1>
            <p className="text-gray-600 text-sm sm:text-base text-center sm:text-left">
              Gestiona el flujo de llegada y verificación de pedidos
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`mb-4 sm:mb-6 grid w-full ${canApprove
            ? 'grid-cols-1 sm:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2'
            } gap-2 sm:gap-0 h-auto p-1 sm:p-1`}>
            <TabsTrigger value="scheduled" className="text-xs sm:text-sm h-10 w-full justify-center flex items-center gap-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Programados Hoy</span>
              <span className="sm:hidden">Programados</span>
            </TabsTrigger>
            <TabsTrigger value="arrived" className="text-xs sm:text-sm h-10 w-full justify-center flex items-center gap-2">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Para Verificar</span>
              <span className="sm:hidden">Verificar</span>
            </TabsTrigger>
            {canApprove && (
              <TabsTrigger value="pending-approval" className="text-xs sm:text-sm h-10 w-full justify-center flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Pendientes Aprobación</span>
                <span className="sm:hidden">Pendientes</span>
              </TabsTrigger>
            )}
            {canApprove && (
              <TabsTrigger value="verified" className="text-xs sm:text-sm h-10 w-full justify-center flex items-center gap-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Verificados</span>
                <span className="sm:hidden">Verificados</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Pedidos programados para llegar hoy */}
          <TabsContent value="scheduled" className="mt-4 sm:mt-6">
            <ScheduledOrdersList />
          </TabsContent>

          {/* Pedidos que llegaron, pendientes de verificar cantidades */}
          <TabsContent value="arrived" className="mt-4 sm:mt-6">
            <ArrivedOrdersList />
          </TabsContent>

          {/* Pedidos pendientes de aprobación (solo admin/manager) */}
          {canApprove && (
            <TabsContent value="pending-approval" className="mt-4 sm:mt-6">
              <PendingApprovalList />
            </TabsContent>
          )}

          {/* Pedidos verificados (completados) */}
          {canApprove && (
            <TabsContent value="verified" className="mt-4 sm:mt-6">
              <VerifiedOrders />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </LayoutMultiRole>
  )
}

export default OrderVerificationContainer