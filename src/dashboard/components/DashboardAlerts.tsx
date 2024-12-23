import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, AlertCard, Button } from '../../components'

const DashboardAlerts = () => {
  const alerts = [
    {
      type: 'Stock',
      message: 'Máquina de Corte - 2 unidades restantes',
      priority: 'high',
      date: new Date()
    },
    {
      type: 'Pedido',
      message: 'Proveedor XYZ - Pedido pendiente',
      priority: 'medium',
      date: new Date()
    },
    {
      type: 'Cierre',
      message: 'Cierre de Caja no realizado hoy',
      priority: 'high',
      date: new Date()
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas alertas</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.map((alert) => (
          <AlertCard key={alert.type} type={alert.type} message={alert.message} priority={alert.priority} date={alert.date} onRemove={() => {}} />
        ))}
      </CardContent>
      <CardFooter>
        <Link to='/notifications' className='w-full'>
          <Button variant='default' className='w-full'>Ver todas las alertas</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default DashboardAlerts
