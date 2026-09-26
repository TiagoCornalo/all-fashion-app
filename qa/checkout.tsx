import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import NewSaleDialog from '../src/billing/components/NewSaleDialog'
import { useCashRegisterStore } from '../src/stores/cashRegisterStore'
import api from '../src/services/config/axios'
import '../src/index.css'
import 'react-toastify/dist/ReactToastify.css'
if (!import.meta.env.DEV || location.hostname !== '127.0.0.1') throw new Error('Sandbox disponible únicamente en desarrollo local')
// Pin this entry point to a disposable database, regardless of the real .env.
api.defaults.baseURL = 'http://127.0.0.1:4418/api'
api.interceptors.request.use(config => { delete config.headers.Authorization; return config })
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
await useCashRegisterStore.getState().fetchCurrentRegister()
function Demo() {
  const [open, setOpen] = useState(true)
  return <QueryClientProvider client={client}><main className='p-6'><h1 className='text-2xl font-bold'>Prueba aislada · Datos ficticios</h1><p>Base temporal y ARCA simulado. CAE ficticio. No conectado a producción.</p><button className='border rounded p-3 mt-5' onClick={() => setOpen(true)}>Nueva venta de prueba</button><NewSaleDialog isOpen={open} onOpenChange={setOpen} /></main><ToastContainer /></QueryClientProvider>
}
createRoot(document.getElementById('root')!).render(<Demo />)
