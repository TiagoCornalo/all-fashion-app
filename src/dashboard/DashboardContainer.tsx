import DashboardLayout from './DashboardLayout'
import DashboardSalesResume from './components/DashboardSalesResume'
import DashboardCalendar from './components/DashboardCalendar'
import DashboardAlerts from './components/DashboardAlerts'

const DashboardContainer = () => {
  return (
    <DashboardLayout>
      <section className='flex flex-col md:flex-row gap-4 p-4'>
        <DashboardSalesResume />
        <DashboardCalendar />
      </section>
      <section className='w-full p-4'>
        <DashboardAlerts />
      </section>
    </DashboardLayout>
  )
}

export default DashboardContainer
