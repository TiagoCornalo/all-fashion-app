import React from 'react'
import { useOrderNotifications } from '../../hooks/useOrderNotifications'
import { UserRole } from '../../types/notifications.types'

/**
 * Componente de badge de notificaciones para la barra superior
 */
export const NotificationBadge: React.FC = () => {
  const {
    notificationCount,
    userRole,
    isConnected,
    pendingVerifications,
    pendingApprovals,
    clearNotificationCount
  } = useOrderNotifications()

  if (!isConnected) {
    return (
      <div className="relative">
        <span className="bg-gray-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
          ⚫
        </span>
        <span className="sr-only">Desconectado</span>
      </div>
    )
  }

  const handleClick = () => {
    clearNotificationCount()
    // Aquí puedes navegar a la página de notificaciones según el rol
    console.log('Badge clicked - notifications cleared')
  }

  const getBadgeColor = (): string => {
    if (userRole === 'ADMIN' && pendingApprovals > 0) {
      return 'bg-red-500' // Urgente para admins
    } else if (userRole === 'MANAGER' && pendingVerifications > 0) {
      return 'bg-orange-500' // Importante para managers
    } else if (notificationCount > 0) {
      return 'bg-blue-500' // Normal
    }
    return 'bg-gray-400' // Sin notificaciones
  }

  const getDisplayCount = (): number => {
    if (userRole === 'ADMIN') {
      return pendingApprovals > 0 ? pendingApprovals : notificationCount
    } else if (userRole === 'MANAGER') {
      return pendingVerifications > 0 ? pendingVerifications : notificationCount
    }
    return notificationCount
  }

  const getTooltipText = (): string => {
    const role = userRole as UserRole
    const statusText = isConnected ? 'Conectado' : 'Desconectado'

    if (role === 'ADMIN' && pendingApprovals > 0) {
      return `${role} - ${pendingApprovals} pedidos requieren aprobación`
    } else if (role === 'MANAGER' && pendingVerifications > 0) {
      return `${role} - ${pendingVerifications} pedidos pendientes de verificación`
    }

    return `${role} - ${statusText}`
  }

  const displayCount = getDisplayCount()

  return (
    <div className="relative cursor-pointer group" onClick={handleClick}>
      <div className="relative">
        {/* Icono de notificaciones mejorado */}
        <svg
          className="w-6 h-6 text-gray-600 hover:text-gray-800 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge con contador */}
        {displayCount > 0 && (
          <span
            className={`absolute -top-2 -right-2 ${getBadgeColor()} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold transition-colors`}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}

        {/* Indicador de conexión */}
        <span
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full transition-colors ${isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}
        />
      </div>

      {/* Tooltip con información del rol */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {getTooltipText()}
      </div>
    </div>
  )
}

/**
 * Componente para mostrar el estado de conexión y rol del usuario
 */
export const ConnectionStatus: React.FC = () => {
  const { userRole, isConnected } = useOrderNotifications()

  const getStatusColor = (): string => {
    return isConnected ? 'bg-green-400' : 'bg-red-400'
  }

  const getStatusText = (): string => {
    return isConnected ? 'En línea' : 'Desconectado'
  }

  const getRoleDisplayName = (role: string | null): string => {
    const roleNames: Record<string, string> = {
      'ADMIN': 'Administrador',
      'MANAGER': 'Gerente',
      'SELLER': 'Vendedor',
      'TECHNICIAN': 'Técnico'
    }

    return role ? roleNames[role] || role : 'Usuario'
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600">
        {getRoleDisplayName(userRole)} - {getStatusText()}
      </span>
    </div>
  )
}

/**
 * Componente de dashboard que muestra estadísticas en tiempo real
 */
export const OrderDashboard: React.FC = () => {
  const {
    orderStats,
    scheduledOrders,
    userRole,
    hasScheduledOrders
  } = useOrderNotifications()

  if (!orderStats) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  const getGridColumns = (): string => {
    if (userRole === 'SELLER') {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={`grid ${getGridColumns()} gap-4 p-4`}>
      {/* Pedidos programados para hoy */}
      <div className="bg-blue-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-blue-800">Programados Hoy</h3>
        <p className="text-2xl font-bold text-blue-600">
          {orderStats.today.scheduledArrivals}
        </p>
        {hasScheduledOrders && (
          <p className="text-sm text-blue-600">
            {scheduledOrders?.totalScheduledToday} pendientes
          </p>
        )}
      </div>

      {/* Llegadas físicas */}
      <div className="bg-green-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-green-800">Llegaron Hoy</h3>
        <p className="text-2xl font-bold text-green-600">
          {orderStats.today.physicalArrivals}
        </p>
      </div>

      {/* Verificados */}
      <div className="bg-purple-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-purple-800">Verificados</h3>
        <p className="text-2xl font-bold text-purple-600">
          {orderStats.today.verified}
        </p>
      </div>

      {/* Pendientes (solo para roles administrativos) */}
      {userRole !== 'SELLER' && (
        <div className="bg-orange-100 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-orange-800">
            {userRole === 'ADMIN' ? 'Necesitan Aprobación' : 'Pendientes Verificación'}
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            {userRole === 'ADMIN'
              ? orderStats.pending.adminApproval
              : orderStats.pending.waitingVerification
            }
          </p>
        </div>
      )}
    </div>
  )
}
