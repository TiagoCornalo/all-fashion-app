import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../../services/config/axios'
import { FiscalInvoiceStatus, getFiscalConfig } from '../../services/checkout'
export default function FiscalPendingList() {
  const { data: config } = useQuery({ queryKey: ['fiscal-config'], queryFn: getFiscalConfig, retry: false })
  const { data, isError } = useQuery({ queryKey: ['fiscal-pending'], enabled: Boolean(config?.configured), retry: false,
    queryFn: async (): Promise<{ total: number; data: FiscalInvoiceStatus[] }> => (await api.get('/fiscal')).data, refetchInterval: 30000 })
  if (!config?.configured) return null
  if (isError) return <p role='status' className='text-sm text-amber-800'>No se pudo actualizar el estado de las facturas pendientes.</p>
  if (!data?.total) return null
  return <section className='rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2'>
    <h2 className='font-semibold text-amber-950'>Facturas pendientes de resolución · {data.total}</h2>
    <p className='text-sm text-amber-900'>Las ventas están guardadas. Revisá su autorización fiscal sin repetir el cobro.</p>
    <ul className='space-y-2'>{data.data.map(item => <li key={item._id} className='text-sm'><Link to={`/sale/${item._id}`} className='underline font-medium'>Venta {item._id.slice(0, 8)}</Link> · {item.status === 'REJECTED' ? 'Rechazada' : item.status === 'UNCERTAIN' ? 'Pendiente de conciliación' : 'Pendiente de autorización'}{item.environment === 'homologation' ? ' · Homologación' : ''}{item.message && <p className='text-xs break-words'>{item.message}</p>}</li>)}</ul>
    {data.total > data.data.length && <p className='text-xs'>Mostrando las {data.data.length} más antiguas.</p>}
  </section>
}
