import DashboardLayout from './DashboardLayout'
import DashboardSalesResume from './components/DashboardSalesResume'
import DashboardCalendar from './components/DashboardCalendar'

const DashboardContainer = () => {
  return (
    <DashboardLayout>
      <section className='flex flex-col md:flex-row gap-4 p-4'>
        <DashboardSalesResume />
        <DashboardCalendar />
      </section>
    </DashboardLayout>
  )
}

export default DashboardContainer
