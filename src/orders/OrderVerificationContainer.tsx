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
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Verificación de Pedidos
            </h1>
            <p className="text-gray-600">
              Gestiona el flujo de llegada y verificación de pedidos
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Programados Hoy
            </TabsTrigger>
            <TabsTrigger value="arrived" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Para Verificar
            </TabsTrigger>
            {canApprove && (
              <TabsTrigger value="pending-approval" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendientes Aprobación
              </TabsTrigger>
            )}
            {canApprove && <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verificados
            </TabsTrigger>}
          </TabsList>

          {/* Pedidos programados para llegar hoy */}
          <TabsContent value="scheduled" className="mt-6">
            <ScheduledOrdersList />
          </TabsContent>

          {/* Pedidos que llegaron, pendientes de verificar cantidades */}
          <TabsContent value="arrived" className="mt-6">
            <ArrivedOrdersList />
          </TabsContent>

          {/* Pedidos pendientes de aprobación (solo admin/manager) */}
          {canApprove && (
            <TabsContent value="pending-approval" className="mt-6">
              <PendingApprovalList />
            </TabsContent>
          )}

          {/* Pedidos verificados (completados) */}
          <TabsContent value="verified" className="mt-6">
            <VerifiedOrders />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutMultiRole>
  )
}

export default OrderVerificationContainer