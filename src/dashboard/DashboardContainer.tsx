import LayoutAdmin from '../layout/LayoutAdmin'
import DashboardSalesResume from './components/DashboardSalesResume'
import DashboardAlerts from './components/DashboardAlerts'
import PendingTransfersPanel from '../components/transfers/PendingTransfersPanel'

const DashboardContainer = () => {
  return (
    <LayoutAdmin>
      {/*       <section className='flex flex-col md:flex-row gap-4 p-4'>
        <DashboardSalesResume />
      </section>
      <section className='w-full p-4'>
        <DashboardAlerts />
      </section> */}
      <section className='w-full p-4'>
        <PendingTransfersPanel />
      </section>
    </LayoutAdmin>
  )
}

export default DashboardContainer
