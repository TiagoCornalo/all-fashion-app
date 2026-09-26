import { useQuery } from '@tanstack/react-query'
import { useSaleStore } from '../../../stores/saleStore'
import { getFiscalConfig } from '../../../services/checkout'
import { Input, Label } from '../../../components'
import { Invoice } from '../../../types/sale.types'

const conditions = [
  [5, 'Consumidor final'], [1, 'Responsable inscripto'], [6, 'Monotributista'],
  [4, 'Exento'], [15, 'No alcanzado']
] as const

export default function InvoiceForm() {
  const { invoice, setInvoice } = useSaleStore()
  const { data: config, isError, isPending } = useQuery({ queryKey: ['fiscal-config'], queryFn: getFiscalConfig, retry: false })
  const fiscal = invoice.type !== 'TICKET' && invoice.type !== 'X'
  const condition = invoice.customer?.vatConditionId ?? 5
  const update = (values: Partial<NonNullable<Invoice['customer']>>) => {
    const customer = { documentType: 'DNI' as const, documentNumber: '', name: '', ...invoice.customer, ...values }
    const type = config?.issuerCondition === 'RI' ? [1, 6, 13, 16].includes(customer.vatConditionId ?? 5) ? 'A' : 'B' : 'C'
    setInvoice({ ...invoice, type: fiscal ? type : 'TICKET', customer, customerName: customer.name })
  }
  const toggle = (enabled: boolean) => {
    if (enabled === fiscal) return
    setInvoice({ ...invoice, type: enabled ? config?.issuerCondition === 'RI' ? 'B' : 'C' : 'TICKET',
      pointOfSale: config?.pointOfSale || 1,
      customer: enabled ? { documentType: 'DNI', documentNumber: '', name: '', vatConditionId: 5 } : undefined,
      customerName: '' })
  }
  return <section className='space-y-3' aria-label='Comprobante'>
    <h3 className='font-semibold'>Comprobante</h3>
    <div className='grid grid-cols-2 gap-2'>
      <button type='button' aria-pressed={!fiscal} onClick={() => toggle(false)} className={`rounded-lg border p-3 text-left text-sm ${!fiscal ? 'border-primary bg-accent' : ''}`}>Comprobante interno<span className='block text-xs text-muted-foreground'>No válido como factura</span></button>
      <button type='button' aria-pressed={fiscal} disabled={!config?.configured} onClick={() => toggle(true)} className={`rounded-lg border p-3 text-left text-sm disabled:opacity-50 ${fiscal ? 'border-primary bg-accent' : ''}`}>Factura electrónica<span className='block text-xs text-muted-foreground'>{config?.environment === 'production' ? 'ARCA · Producción' : 'ARCA · Homologación'}</span></button>
    </div>
    {!config?.configured && <p className='text-xs text-muted-foreground'>{isPending ? 'Consultando configuración fiscal…' : isError ? 'No se pudo consultar la configuración fiscal. La emisión está deshabilitada.' : config?.error}</p>}
    {fiscal && <>
      <Label htmlFor='invoice-condition'>Condición de IVA del cliente</Label>
      <select id='invoice-condition' className='w-full rounded-md border bg-background p-2' value={condition} onChange={e => update({ vatConditionId: Number(e.target.value), documentType: ['1', '6'].includes(e.target.value) ? 'CUIT' : 'DNI', documentNumber: '' })}>
        {conditions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <p className='rounded-md bg-accent p-2 text-sm'>Factura {invoice.type} · Punto de venta {invoice.pointOfSale}</p>
      <div className='grid grid-cols-[100px_1fr] gap-2'>
        <div><Label htmlFor='invoice-doc-type'>Documento</Label><select id='invoice-doc-type' className='mt-1 w-full rounded-md border bg-background p-2' value={invoice.customer?.documentType || 'DNI'} onChange={e => update({ documentType: e.target.value as 'DNI' | 'CUIT' })}><option value='DNI'>DNI</option><option value='CUIT'>CUIT</option></select></div>
        <div><Label htmlFor='invoice-doc-number'>Número</Label><Input id='invoice-doc-number' inputMode='numeric' value={invoice.customer?.documentNumber || ''} onChange={e => update({ documentNumber: e.target.value })} className='mt-1' /></div>
      </div>
      <div><Label htmlFor='invoice-name'>Nombre o razón social</Label><Input id='invoice-name' value={invoice.customer?.name || ''} onChange={e => update({ name: e.target.value })} /></div>
      <div><Label htmlFor='invoice-address'>Domicilio</Label><Input id='invoice-address' value={invoice.customer?.address || ''} onChange={e => update({ address: e.target.value })} /></div>
    </>}
  </section>
}
