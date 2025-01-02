import React, { createContext, useContext, useEffect } from 'react'
import { authService } from '../services/auth.service'
import { io, Socket } from 'socket.io-client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../types/alert.types'
import { Cross, Package, Warning, ChartDecreasing, YellowCircle } from '../assets'

interface NotificationsContextType {
  socket: Socket | null
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

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      return
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      console.log('Socket conectado para notificaciones')
    })

    socket.on('newAlerts', (alerts: Alert[]) => {
      alerts.forEach((alert: Alert) => {
        const getToastConfig = (type: string) => {
          switch (type) {
            case 'NO_STOCK':
              return {
                icon: (
                  <div className='flex items-center gap-2'>
                    <Cross />
                    <Package />
                  </div>
                ),
                className: 'bg-red-400 text-white'
              }
            case 'BELOW_MINIMUM':
              return {
                icon: (
                  <div className='flex items-center gap-2'>
                    <Warning />
                    <ChartDecreasing />
                  </div>
                ),
                className: 'bg-yellow-400 text-white'
              }
            case 'NEAR_MINIMUM':
              return {
                icon: (
                  <div className='flex items-center gap-2'>
                    <YellowCircle />
                    <Package />
                  </div>
                ),
                className: 'bg-green-400 text-white'
              }
            default:
              return {
                icon: null,
                className: ''
              }
          }
        }

        const config = getToastConfig(alert.type)

        toast(
          <div
            onClick={() => navigate('/inventory')}
            className='cursor-pointer'
          >
            <div className='flex items-center gap-2 mb-2'>
              {config.icon}
            </div>
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

    socket.on('connect_error', (error) => {
      console.error('Error de conexión socket:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [navigate])

  return (
    <NotificationsContext.Provider value={{ socket: null }}>
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
