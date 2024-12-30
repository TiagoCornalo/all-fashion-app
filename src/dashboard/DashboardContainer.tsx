import LayoutAdmin from '../layout/LayoutAdmin'
import DashboardSalesResume from './components/DashboardSalesResume'
import DashboardCalendar from './components/DashboardCalendar'
import DashboardAlerts from './components/DashboardAlerts'

const DashboardContainer = () => {
  return (
    <LayoutAdmin>
      <section className='flex flex-col md:flex-row gap-4 p-4'>
        <DashboardSalesResume />
        <DashboardCalendar />
      </section>
      <section className='w-full p-4'>
        <DashboardAlerts />
      </section>
    </LayoutAdmin>
  )
}

export default DashboardContainer
