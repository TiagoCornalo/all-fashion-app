import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';
import './App.css'

const SignIn = lazy(() => import('./auth/components/SignIn'));
const DashboardContainer = lazy(() => import('./dashboard/DashboardContainer'));
const BarcodeReaderWithCamera = lazy(() => import('./components/shared/BarCodeLector'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      {/* TODO: Dashboard es una ruta protegida, por lo que se debe validar el token con su respectivo rol de administrador */}
      <Route path="/dashboard" element={<DashboardContainer />} />
      <Route path="/barcode" element={<BarcodeReaderWithCamera />} />
    </Routes>
  )
}

export default App
