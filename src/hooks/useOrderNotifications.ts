import { useEffect, useState } from 'react'
import { useNotifications } from '../context/NotificationsContext'
import { OrderStats, ScheduledOrdersUpdate, NotificationData } from '../types/notifications.types'

/**
 * Hook personalizado para manejar notificaciones de pedidos
 */
export const useOrderNotifications = () => {
  const { socket, userRole, isConnected } = useNotifications()
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrdersUpdate | null>(null)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (!socket || !isConnected) return

    // Actualizar estadísticas en tiempo real
    const handleOrderStatsUpdate = (data: OrderStats) => {
      setOrderStats(data)
      console.log('📊 Dashboard actualizado:', data)
    }

    // Actualizar lista de pedidos programados
    const handleScheduledOrdersUpdate = (data: ScheduledOrdersUpdate) => {
      setScheduledOrders(data)
      console.log('📋 Pedidos programados actualizados:', data.totalScheduledToday)
    }

    // Contar notificaciones para badge
    const handleNotificationReceived = () => {
      setNotificationCount(prev => prev + 1)
    }

    // Listeners
    socket.on('orderStatsUpdate', handleOrderStatsUpdate)
    socket.on('scheduledOrdersUpdate', handleScheduledOrdersUpdate)

    // Eventos que incrementan contador de notificaciones
    socket.on('orderScheduledForToday', handleNotificationReceived)
    socket.on('orderArrivedPhysically', handleNotificationReceived)

    if (userRole === 'ADMIN') {
      socket.on('adminAlert', handleNotificationReceived)
      socket.on('orderVerifiedByEmployee', handleNotificationReceived)
    } else if (userRole === 'MANAGER') {
      socket.on('managerAlert', handleNotificationReceived)
      socket.on('orderVerifiedByEmployee', handleNotificationReceived)
    }

    socket.on('userNotification', handleNotificationReceived)
    socket.on('staffNotification', handleNotificationReceived)

    return () => {
      socket.off('orderStatsUpdate', handleOrderStatsUpdate)
      socket.off('scheduledOrdersUpdate', handleScheduledOrdersUpdate)
      socket.off('orderScheduledForToday', handleNotificationReceived)
      socket.off('orderArrivedPhysically', handleNotificationReceived)

      if (userRole === 'ADMIN') {
        socket.off('adminAlert', handleNotificationReceived)
        socket.off('orderVerifiedByEmployee', handleNotificationReceived)
      } else if (userRole === 'MANAGER') {
        socket.off('managerAlert', handleNotificationReceived)
        socket.off('orderVerifiedByEmployee', handleNotificationReceived)
      }

      socket.off('userNotification', handleNotificationReceived)
      socket.off('staffNotification', handleNotificationReceived)
    }
  }, [socket, isConnected, userRole])

  // Función para limpiar contador de notificaciones
  const clearNotificationCount = () => {
    setNotificationCount(0)
  }

  // Función para enviar notificación personalizada
  const emitCustomNotification = (event: string, data: NotificationData | Record<string, unknown>) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  return {
    // Estados
    orderStats,
    scheduledOrders,
    notificationCount,
    isConnected,
    userRole,

    // Funciones
    clearNotificationCount,
    emitCustomNotification,

    // Datos derivados
    hasScheduledOrders: scheduledOrders && scheduledOrders.totalScheduledToday > 0,
    pendingVerifications: orderStats?.pending.waitingVerification || 0,
    pendingApprovals: orderStats?.pending.adminApproval || 0
  }
}

/**
 * Hook para componentes que necesitan datos específicos del dashboard
 */
export const useOrderDashboard = () => {
  const { orderStats, scheduledOrders, userRole } = useOrderNotifications()

  // Datos filtrados según el rol
  const getDashboardData = () => {
    if (!orderStats) return null

    const baseData = {
      today: orderStats.today,
      timestamp: orderStats.timestamp,
      date: orderStats.date
    }

    if (userRole === 'SELLER') {
      // Vista simplificada para sellers
      return {
        ...baseData,
        isSimplified: true,
        availableActions: ['view_scheduled', 'confirm_arrival', 'verify_orders']
      }
    } else if (userRole === 'MANAGER') {
      // Vista completa para managers
      return {
        ...baseData,
        pending: orderStats.pending,
        isSimplified: false,
        availableActions: ['view_all', 'approve_orders', 'manage_staff']
      }
    } else if (userRole === 'ADMIN') {
      // Vista completa para admins
      return {
        ...baseData,
        pending: orderStats.pending,
        isSimplified: false,
        availableActions: ['full_access', 'system_admin', 'manage_users']
      }
    }

    return baseData
  }

  return {
    dashboardData: getDashboardData(),
    scheduledOrders: scheduledOrders?.orders || [],
    totalScheduledToday: scheduledOrders?.totalScheduledToday || 0,
    userRole,
    hasManagerialAccess: ['ADMIN', 'MANAGER'].includes(userRole || '')
  }
}