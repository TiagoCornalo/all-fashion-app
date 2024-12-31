import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { AlertCard } from '../../components'
import { getAlerts, resolveAlert } from '../../services/alerts'
import { Loader } from '../../components'
import { Alert } from '../../types/alert.types'

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let socket: Socket | undefined

    const fetchAlerts = async () => {
      try {
        const response = await getAlerts('PENDING')
        setAlerts(response.data)
      } catch (error) {
        console.error('Error fetching alerts:', error)
      } finally {
        setLoading(false)
      }
    }

    const initializeSocket = () => {
      socket = io(import.meta.env.VITE_SOCKET_URL || '', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      socket.on('connect', () => {
        fetchAlerts()
      })

      socket.on('connect_error', (error) => {
        console.error('Error de conexión socket:', error)
      })

      socket.on('newAlerts', (newAlerts: Alert[]) => {
        setAlerts((prevAlerts) => {
          const newAlertsIds = new Set(newAlerts.map((alert) => alert._id))
          const filteredPrevAlerts = prevAlerts.filter(
            (alert) => !newAlertsIds.has(alert._id)
          )
          return [...newAlerts, ...filteredPrevAlerts]
        })
      })

      socket.on('alertResolved', (alertId: string) => {
        setAlerts((prevAlerts) =>
          prevAlerts.filter((alert) => alert._id !== alertId)
        )
      })

      socket.on('disconnect', () => {
        console.log('Socket desconectado')
      })
    }

    fetchAlerts()
    initializeSocket()

    return () => {
      if (socket) {
        socket.off('newAlerts')
        socket.off('alertResolved')
        socket.off('connect')
        socket.off('connect_error')
        socket.off('disconnect')
        socket.disconnect()
      }
    }
  }, [])

  const handleResolveAlert = async (alertId: string, note: string) => {
    try {
      const response = await resolveAlert(alertId, note)
      if (response.ok) {
        setAlerts((prevAlerts) =>
          prevAlerts.filter((alert) => alert._id !== alertId)
        )
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center'>
        <Loader />
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-2xl font-bold'>Alertas de Inventario</h2>
      {alerts.length === 0 ? (
        <p>No hay alertas pendientes</p>
      ) : (
        <div className='grid gap-4 max-h-[500px] overflow-y-auto scroll-shadow'>
          {alerts.length > 0 &&
            alerts.map((alert) => (
              <AlertCard
                key={alert._id}
                type={alert.type}
                message={alert.message}
                product={alert.product}
                createdAt={alert.createdAt}
                onResolve={(note) => handleResolveAlert(alert._id, note)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

export default InventoryAlerts
