import React, { createContext, useContext, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { Alert } from '../types/alert.types'

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
        toast.warning(
          <div
            onClick={() => navigate('/inventory')}
            className='cursor-pointer'
          >
            <p className='font-bold'>{alert.product.name}</p>
            <p>{alert.message}</p>
          </div>,
          {
            position: 'bottom-right',
            autoClose: 5000,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true
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
