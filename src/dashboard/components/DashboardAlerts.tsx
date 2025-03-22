import { Card, CardContent } from '../../components'
import { InventoryAlerts } from '../../inventory/components'

const DashboardAlerts = () => {
  return (
    <Card>
      <CardContent className='py-4'>
        <InventoryAlerts />
      </CardContent>
    </Card>
  )
}

export default DashboardAlerts
