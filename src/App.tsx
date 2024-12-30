import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';
import './App.css'

const AuthContainer = lazy(() => import('./auth/AuthContainer'));
const DashboardContainer = lazy(() => import('./dashboard/DashboardContainer'));
const InventoryContainer = lazy(() => import('./inventory/InventoryContainer'));
const BarcodeReaderWithCamera = lazy(() => import('./components/shared/BarCodeLector'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthContainer />} />
      {/* TODO: Dashboard es una ruta protegida, por lo que se debe validar el token con su respectivo rol de administrador */}
      <Route path="/dashboard" element={<DashboardContainer />} />
      <Route path="/inventory" element={<InventoryContainer />} />
      <Route path="/barcode" element={<BarcodeReaderWithCamera />} />
    </Routes>
  )
}

export default App
