import { NotificationsProvider } from './context/NotificationsContext'
import { AuthProvider } from './context/auth/AuthProvider'
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Loader, SuspenseErrorBoundary } from './components'
import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

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
const UserManagementContainer = lazy(() => import('./users/UserManagementContainer'))

// Nuevos componentes para verificación de pedidos
const OrderVerificationContainer = lazy(() => import('./orders/OrderVerificationContainer'))
const OrderVerificationForm = lazy(() => import('./orders/components/verification/OrderVerificationForm'))

// Cuentas corrientes
const AccountsPayableContainer = lazy(() => import('./accounts-payable/AccountsPayableContainer'))
const AccountDetailContainer = lazy(() => import('./accounts-payable/AccountDetailContainer'))
const EditAccountContainer = lazy(() => import('./accounts-payable/EditAccountContainer'))

// Remitos y presupuestos
const QuotesContainer = lazy(() => import('./quotes/QuotesContainer'))

// Servicios técnicos
const TechnicalServicesContainer = lazy(() => import('./technical-services/containers/TechnicalServicesContainer'))

const SuspenseFallback = () => (
  <div className='fixed inset-0 flex justify-center items-center bg-white z-50'>
    <Loader className='h-8 w-8' />
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuspenseErrorBoundary>
        <AuthProvider>
          <NotificationsProvider>
            <Suspense fallback={<SuspenseFallback />}>
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
                <Route path='/users' element={<UserManagementContainer />} />

                {/* Rutas para verificación de pedidos */}
                <Route path='/orders/verification' element={<OrderVerificationContainer />} />
                <Route path='/orders/verify/:orderId' element={<OrderVerificationForm />} />

                {/* Rutas para cuentas corrientes */}
                <Route path='/accounts-payable' element={<AccountsPayableContainer />} />
                <Route path='/accounts-payable/:id' element={<AccountDetailContainer />} />
                <Route path='/accounts-payable/:id/edit' element={<EditAccountContainer />} />

                {/* Rutas para remitos y presupuestos */}
                <Route path='/quotes' element={<QuotesContainer />} />

                {/* Rutas para servicios técnicos */}
                <Route path='/technical-services' element={<TechnicalServicesContainer />} />
              </Routes>
            </Suspense>
          </NotificationsProvider>
        </AuthProvider>
      </SuspenseErrorBoundary>
    </QueryClientProvider>
  )
}

export default App
