import { NotificationsProvider } from './context/NotificationsContext'
import { AuthProvider } from './context/auth/AuthProvider'
import { Routes, Route } from 'react-router-dom'
import { lazy } from 'react'
import './App.css'

const AuthContainer = lazy(() => import('./auth/AuthContainer'))
const DashboardContainer = lazy(() => import('./dashboard/DashboardContainer'))
const InventoryContainer = lazy(() => import('./inventory/InventoryContainer'))
const BarcodeReaderWithCamera = lazy(
  () => import('./components/shared/BarCodeLector')
)
const BillingContainer = lazy(() => import('./billing/BillingContainer'))

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Routes>
          <Route path='/' element={<AuthContainer />} />
          <Route path='/dashboard' element={<DashboardContainer />} />
          <Route path='/inventory' element={<InventoryContainer />} />
          <Route path='/barcode' element={<BarcodeReaderWithCamera />} />
          <Route path='/billing' element={<BillingContainer />} />
        </Routes>
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App
