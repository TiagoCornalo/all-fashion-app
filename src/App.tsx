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
const CashRegisterContainer = lazy(
  () => import('./cash-register/CashRegisterContainer')
)
const SuppliersContainer = lazy(() => import('./suppliers/SuppliersContainer'))
const SupplierDetailContainer = lazy(
  () => import('./suppliers/SupplierDetailContainer')
)
const OrderDetailContainer = lazy(() => import('./order/OrderContainer'))
const SaleContainer = lazy(() => import('./sale/SaleContainer'))
const DiscountsContainer = lazy(() => import('./discounts/DiscountsContainer'))
const CombosContainer = lazy(() => import('./combos/CombosContainer'))
const HomeContainer = lazy(() => import('./home/HomeContainer'))

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Routes>
          <Route path='/' element={<AuthContainer />} />
          <Route path='/home' element={<HomeContainer />} />
          <Route path='/dashboard' element={<DashboardContainer />} />
          <Route path='/inventory' element={<InventoryContainer />} />
          <Route path='/barcode' element={<BarcodeReaderWithCamera />} />
          <Route path='/billing' element={<BillingContainer />} />
          <Route path='/suppliers' element={<SuppliersContainer />} />
          <Route
            path='/cash-registers/:id'
            element={<CashRegisterContainer />}
          />
          <Route path='/suppliers/:id' element={<SupplierDetailContainer />} />
          <Route path='/orders/:id' element={<OrderDetailContainer />} />
          <Route path='/sale/:id' element={<SaleContainer />} />
          <Route path='/discounts' element={<DiscountsContainer />} />
          <Route path='/combos' element={<CombosContainer />} />
        </Routes>
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App
