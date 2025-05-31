import React, { startTransition } from 'react'
import { toast, ToastOptions } from 'react-toastify'
import { NavigateFunction } from 'react-router-dom'
import {
  NotificationConfig,
  UserRole,
  AdminAlertData,
  ManagerAlertData,
  OrderVerifiedByEmployeeData
} from '../types/notifications.types'

/**
 * Servicio centralizado para manejar notificaciones
 */
export class NotificationService {
  private navigate: NavigateFunction

  constructor(navigate: NavigateFunction) {
    this.navigate = navigate
  }

  /**
   * Configuraciones predefinidas de toast según el tipo de notificación
   */
  private getToastConfig(type: 'success' | 'error' | 'warning' | 'info', config?: NotificationConfig): ToastOptions {
    const baseConfig: ToastOptions = {
      position: config?.position || 'top-right',
      autoClose: config?.autoClose !== undefined ? config.autoClose : 5000,
      closeOnClick: config?.closeOnClick !== undefined ? config.closeOnClick : true,
      className: config?.className || ''
    }

    return baseConfig
  }

  /**
   * Navegar de forma segura usando startTransition
   */
  private safeNavigate(to: string) {
    startTransition(() => {
      this.navigate(to)
    })
  }

  /**
   * Crear notificación de éxito
   */
  showSuccess(message: string | React.ReactNode, navigateTo?: string, config?: NotificationConfig) {
    const content = navigateTo ? (
      <div onClick={() => this.safeNavigate(navigateTo)} className="cursor-pointer">
        {message}
      </div>
    ) : message

    toast.success(content, this.getToastConfig('success', config))
  }

  /**
   * Crear notificación de error
   */
  showError(message: string | React.ReactNode, navigateTo?: string, config?: NotificationConfig) {
    const content = navigateTo ? (
      <div onClick={() => this.safeNavigate(navigateTo)} className="cursor-pointer">
        {message}
      </div>
    ) : message

    toast.error(content, this.getToastConfig('error', config))
  }

  /**
   * Crear notificación de advertencia
   */
  showWarning(message: string | React.ReactNode, navigateTo?: string, config?: NotificationConfig) {
    const content = navigateTo ? (
      <div onClick={() => this.safeNavigate(navigateTo)} className="cursor-pointer">
        {message}
      </div>
    ) : message

    toast.warning(content, this.getToastConfig('warning', config))
  }

  /**
   * Crear notificación informativa
   */
  showInfo(message: string | React.ReactNode, navigateTo?: string, config?: NotificationConfig) {
    const content = navigateTo ? (
      <div onClick={() => this.safeNavigate(navigateTo)} className="cursor-pointer">
        {message}
      </div>
    ) : message

    toast.info(content, this.getToastConfig('info', config))
  }

  /**
   * Manejar alertas de administrador
   */
  handleAdminAlert(data: AdminAlertData) {
    const { event, message, requiresAction, sound, persistent } = data

    const getAlertConfig = (event: string) => {
      switch (event) {
        case 'orderVerifiedCorrect':
          return { type: 'success' as const, sound: false }
        case 'orderVerifiedWithIssues':
          return { type: 'error' as const, sound: true }
        case 'criticalSystemAlert':
          return { type: 'error' as const, sound: true, persistent: true }
        default:
          return { type: 'info' as const, sound: false }
      }
    }

    const config = getAlertConfig(event)
    const toastConfig: NotificationConfig = {
      position: 'top-center',
      autoClose: config.persistent || persistent ? false : 7000,
      closeOnClick: !(config.persistent || persistent),
      className: 'cursor-pointer'
    }

    const content = (
      <div onClick={() => this.safeNavigate('/orders/verification')}>
        <p className='font-bold'>🚨 Alerta Administrativa</p>
        <p>{message}</p>
        {requiresAction && (
          <p className='text-sm font-semibold'>⚡ Requiere acción inmediata</p>
        )}
      </div>
    )

    if (config.type === 'error') {
      toast.error(content, this.getToastConfig('error', toastConfig))
    } else if (config.type === 'success') {
      toast.success(content, this.getToastConfig('success', toastConfig))
    } else {
      toast.info(content, this.getToastConfig('info', toastConfig))
    }

    // Reproducir sonido si es necesario
    if (config.sound || sound) {
      this.playNotificationSound('alert')
    }
  }

  /**
   * Manejar alertas de manager
   */
  handleManagerAlert(data: ManagerAlertData) {
    const content = (
      <div onClick={() => this.safeNavigate('/orders/verification')}>
        <p className='font-bold'>👔 Alerta de Gestión</p>
        <p>{data.message}</p>
      </div>
    )

    this.showWarning(content, undefined, {
      autoClose: 6000,
      className: 'cursor-pointer'
    })
  }

  /**
   * Manejar verificaciones de empleados
   */
  handleOrderVerification(data: OrderVerifiedByEmployeeData, userRole: UserRole) {
    if (!data.allCorrect && data.priority === 'high') {
      if (userRole === 'ADMIN') {
        // Faltantes reportados - alerta urgente para admin
        const content = (
          <div onClick={() => this.safeNavigate('/orders/verification')}>
            <p className='font-bold'>🚨 FALTANTES REPORTADOS</p>
            <p>{data.message}</p>
            <p className='text-sm font-semibold'>Click para revisar ahora</p>
          </div>
        )

        toast.error(content, {
          position: 'top-center',
          autoClose: false,
          closeOnClick: false,
          className: 'cursor-pointer border-2 border-red-600'
        })

        this.playNotificationSound('urgent')
      } else if (userRole === 'MANAGER') {
        // Faltantes reportados - alerta para manager
        const content = (
          <div onClick={() => this.safeNavigate('/orders/verification')}>
            <p className='font-bold'>⚠️ Faltantes en pedido</p>
            <p>{data.message}</p>
          </div>
        )

        this.showWarning(content, undefined, {
          autoClose: 7000,
          className: 'cursor-pointer'
        })
      }
    } else {
      // Verificación exitosa
      this.showSuccess(data.message, undefined, {
        autoClose: 4000
      })
    }
  }

  /**
   * Reproducir sonido de notificación
   */
  private playNotificationSound(type: 'normal' | 'alert' | 'urgent') {
    // Aquí puedes implementar la lógica para reproducir sonidos
    // Por ejemplo, usando Web Audio API o elementos de audio HTML
    console.log(`🔊 Reproducir sonido de ${type}`)

    // Ejemplo básico con Audio API
    try {
      const audio = new Audio()
      switch (type) {
        case 'normal':
          // audio.src = '/sounds/notification.mp3'
          break
        case 'alert':
          // audio.src = '/sounds/alert.mp3'
          break
        case 'urgent':
          // audio.src = '/sounds/urgent.mp3'
          break
        default:
          audio.src = '/sounds/notification.mp3'
          break
      }
      audio.play().catch(console.error)
    } catch (error) {
      console.error('Error reproduciendo sonido:', error)
    }
  }

  /**
   * Formatear mensaje de pedido programado
   */
  formatScheduledOrderMessage(supplier: string, itemCount: number): string {
    return `Pedido de ${supplier} con ${itemCount} artículos programado para hoy`
  }

  /**
   * Formatear mensaje de llegada física
   */
  formatPhysicalArrivalMessage(supplier: string, itemCount: number, isAdmin = false): string {
    const prefix = isAdmin ? '[Admin] ' : ''
    return `${prefix}Pedido de ${supplier} con ${itemCount} artículos llegó físicamente`
  }

  /**
   * Obtener rutas de navegación según el rol
   */
  getNavigationRoutes(userRole: UserRole) {
    const routes = {
      'ADMIN': {
        orders: '/orders/verification',
        approval: '/orders/verification',
        dashboard: '/dashboard',
        verification: '/orders/verification',
        scheduled: '/orders/verification'
      },
      'MANAGER': {
        orders: '/orders/verification',
        approval: '/orders/verification',
        dashboard: '/dashboard',
        verification: '/orders/verification',
        scheduled: '/orders/verification'
      },
      'SELLER': {
        orders: '/orders/verification',
        scheduled: '/orders/verification',
        verification: '/orders/verification',
        dashboard: '/dashboard'
      }
    }

    return routes[userRole] || routes['SELLER']
  }
}

/**
 * Hook para usar el servicio de notificaciones
 */
export const useNotificationService = (navigate: NavigateFunction) => {
  return new NotificationService(navigate)
}