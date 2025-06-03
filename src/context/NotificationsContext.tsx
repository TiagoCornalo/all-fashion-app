import React, { createContext, useContext, useEffect, useState, startTransition } from 'react'
import { authService } from '../services/auth.service'
import { io, Socket } from 'socket.io-client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../types/alert.types'
import { Cross, Package, Warning, ChartDecreasing, YellowCircle } from '../assets'
import {
  OrderNotification,
  OrderArrivedPhysicallyData,
  AdminAlertData,
  ManagerAlertData,
  StaffNotificationData,
  UserSpecificNotificationData,
  OrderVerifiedByEmployeeData,
  OrderStats,
  ScheduledOrdersUpdate,
  UserRole
} from '../types/notifications.types'
import { useNotificationService } from '../services/notificationService'

interface NotificationsContextType {
  socket: Socket | null
  userRole: string | null
  isConnected: boolean
}

const NotificationsContext = createContext<NotificationsContextType | null>(
  null
)

export const NotificationsProvider = ({
  children
}: {
  children: React.ReactNode
}) => {
  const navigate = useNavigate()
  const notificationService = useNotificationService(navigate)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      return
    }

    // Obtener token y datos del usuario
    const token = authService.getToken()
    const userData = authService.getCurrentUser()

    if (!token || !userData) {
      console.error('No se pudo obtener token o datos del usuario')
      return
    }

    startTransition(() => {
      setUserRole(userData.role)
    })

    // Configurar socket con autenticación
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4400', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token
      }
    })

    setSocket(socketInstance)

    // Eventos de conexión
    socketInstance.on('connect', () => {
      console.log('Socket conectado y autenticado')
      startTransition(() => {
        setIsConnected(true)
      })
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Error de conexión socket:', error.message)
      startTransition(() => {
        setIsConnected(false)
      })

      if (error.message === 'Authentication failed') {
        startTransition(() => {
          authService.logout()
          navigate('/')
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket desconectado')
      startTransition(() => {
        setIsConnected(false)
      })
    })

    // Evento de bienvenida con confirmación de rol
    socketInstance.on('welcome', (data: { role: string, message: string, permissions: string[] }) => {
      console.log(`Usuario autenticado: ${data.role}`)
      startTransition(() => {
        setUserRole(data.role)
      })
    })

    // ========== EVENTOS DE ALERTAS DE INVENTARIO ==========
    socketInstance.on('newAlerts', (alerts: Alert[]) => {
      alerts.forEach((alert: Alert) => {
        const getToastConfig = (type: string) => {
          switch (type) {
            case 'NO_STOCK':
              return {
                icon: <div className='flex items-center gap-2'><Cross /><Package /></div>,
                className: 'bg-red-400 text-white'
              }
            case 'BELOW_MINIMUM':
              return {
                icon: <div className='flex items-center gap-2'><Warning /><ChartDecreasing /></div>,
                className: 'bg-yellow-400 text-white'
              }
            case 'NEAR_MINIMUM':
              return {
                icon: <div className='flex items-center gap-2'><YellowCircle /><Package /></div>,
                className: 'bg-green-400 text-white'
              }
            default:
              return { icon: null, className: '' }
          }
        }

        const config = getToastConfig(alert.type)
        toast(
          <div onClick={() => startTransition(() => navigate('/inventory'))} className='cursor-pointer'>
            <div className='flex items-center gap-2 mb-2'>{config.icon}</div>
            <p className='font-bold'>{alert.product.name}</p>
            <p>{alert.message}</p>
          </div>,
          {
            position: 'bottom-right',
            autoClose: 5000,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            className: config.className
          }
        )
      })
    })

    // ========== EVENTOS DE PEDIDOS ==========

    // Pedidos programados para hoy
    socketInstance.on('orderScheduledForToday', (data: OrderNotification) => {
      const routes = notificationService.getNavigationRoutes(userData.role as UserRole)
      const targetRoute = (routes as any).scheduled || routes.orders

      notificationService.showSuccess(
        <div>
          <p className='font-bold'>📅 Pedido programado para hoy</p>
          <p>{notificationService.formatScheduledOrderMessage(data.supplier, data.itemCount)}</p>
          <p className='text-sm opacity-75'>Click para ver detalles</p>
        </div>,
        targetRoute,
        { autoClose: 5000, className: 'cursor-pointer' }
      )
    })

    // Llegadas físicas
    socketInstance.on('orderArrivedPhysically', (data: OrderArrivedPhysicallyData) => {
      const routes = notificationService.getNavigationRoutes(userData.role as UserRole)

      if (!data.adminContext) {
        // Para staff
        notificationService.showSuccess(
          <div>
            <p className='font-bold'>📦 Pedido llegó físicamente</p>
            <p>{notificationService.formatPhysicalArrivalMessage(data.supplier, data.itemCount)}</p>
            <p className='text-sm opacity-75'>Click para verificar</p>
          </div>,
          routes.verification,
          { autoClose: 6000, className: 'cursor-pointer' }
        )
      } else {
        // Para admins
        notificationService.showInfo(
          <div>
            <p className='font-bold'>👑 [Admin] Pedido recibido</p>
            <p>{notificationService.formatPhysicalArrivalMessage(data.supplier, data.itemCount, true)}</p>
          </div>,
          routes.orders,
          { autoClose: 4000, className: 'cursor-pointer' }
        )
      }
    })

    // ========== EVENTOS ESPECÍFICOS POR ROL ==========

    if (userData.role === 'ADMIN') {
      // Alertas administrativas
      socketInstance.on('adminAlert', (data: AdminAlertData) => {
        notificationService.handleAdminAlert(data)
      })

      // Verificaciones de empleados
      socketInstance.on('orderVerifiedByEmployee', (data: OrderVerifiedByEmployeeData) => {
        notificationService.handleOrderVerification(data, 'ADMIN')
      })

    } else if (userData.role === 'MANAGER') {
      // Alertas de gestión
      socketInstance.on('managerAlert', (data: ManagerAlertData) => {
        notificationService.handleManagerAlert(data)
      })

      // Verificaciones de empleados
      socketInstance.on('orderVerifiedByEmployee', (data: OrderVerifiedByEmployeeData) => {
        notificationService.handleOrderVerification(data, 'MANAGER')
      })

    } else if (userData.role === 'SELLER') {
      // Estadísticas simplificadas para sellers
      socketInstance.on('orderStatsUpdate', (data: OrderStats) => {
        if (data.isSimplified && data.userRole === 'SELLER') {
          console.log('📊 Estadísticas actualizadas para seller:', data)
        }
      })
    }

    // ========== EVENTOS COMUNES ==========

    // Notificaciones del staff
    socketInstance.on('staffNotification', (data: StaffNotificationData) => {
      notificationService.showInfo(
        <div>
          <p className='font-bold'>📢 Notificación del Staff</p>
          <p>{data.message}</p>
        </div>,
        undefined,
        { position: 'bottom-left', autoClose: 5000 }
      )
    })

    // Notificaciones personales
    socketInstance.on('userNotification', (data: UserSpecificNotificationData) => {
      const personalEvents = {
        'arrivalConfirmed': () => {
          notificationService.showSuccess(`✅ ${data.message}`, undefined, { autoClose: 4000 })
        },
        'verificationCompleted': () => {
          notificationService.showSuccess(`✅ ${data.message}`, undefined, { autoClose: 5000 })
          if (!data.allCorrect) {
            notificationService.showInfo(
              'Un administrador o manager revisará los faltantes reportados',
              undefined,
              { autoClose: 6000 }
            )
          }
        },
        'orderScheduledConfirmation': () => {
          notificationService.showSuccess(`📅 ${data.message}`, undefined, { autoClose: 4000 })
        }
      }

      const handler = personalEvents[data.event as keyof typeof personalEvents]
      if (handler) {
        handler()
      } else {
        notificationService.showInfo(`👤 ${data.message}`, undefined, { autoClose: 5000 })
      }
    })

    // Actualización de datos en tiempo real
    socketInstance.on('scheduledOrdersUpdate', (data: ScheduledOrdersUpdate) => {
      console.log('📋 Lista de pedidos programados actualizada:', data)
    })

    socketInstance.on('orderStatsUpdate', (data: OrderStats) => {
      console.log('📊 Estadísticas actualizadas:', data)
    })

    // Cleanup
    return () => {
      console.log('Desconectando socket...')
      socketInstance.disconnect()
      startTransition(() => {
        setSocket(null)
        setIsConnected(false)
      })
    }
  }, [navigate]) // Dependencia solo de navigate

  return (
    <NotificationsContext.Provider value={{
      socket,
      userRole,
      isConnected
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error(
      'useNotifications debe usarse dentro de NotificationsProvider'
    )
  }
  return context
}