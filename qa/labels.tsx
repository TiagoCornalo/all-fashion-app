import React from 'react'
import { createRoot } from 'react-dom/client'
import { LabelPrintCenter } from '../src/inventory/components/LabelPrintDialog'
import api from '../src/services/config/axios'
import '../src/index.css'
if (!import.meta.env.DEV || location.hostname !== '127.0.0.1') throw new Error('Solo desarrollo local')
api.defaults.baseURL = 'http://127.0.0.1:4418/api'
api.interceptors.request.use(config => { delete config.headers.Authorization; return config })
createRoot(document.getElementById('root')!).render(<main className='mx-auto max-w-5xl space-y-5 p-6'><h1 className='text-2xl font-bold'>Etiquetas de productos · Prueba aislada</h1><p>Datos ficticios · API de productos con rol vendedor · Sin cambios en producción</p><LabelPrintCenter /></main>)
