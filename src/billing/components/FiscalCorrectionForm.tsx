import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Label } from '../../components'
import { Invoice } from '../../types/sale.types'
import { getFiscalConfig } from '../../services/checkout'
export default function FiscalCorrectionForm({ invoice, onSave, disabled }: { invoice: Invoice; onSave: (invoice: Invoice) => Promise<void>; disabled: boolean }) {
  const { data: config } = useQuery({ queryKey: ['fiscal-config'], queryFn: getFiscalConfig })
  const [customer, setCustomer] = useState({ documentType: 'DNI' as 'DNI' | 'CUIT', documentNumber: '', name: '', address: '', vatConditionId: 5, ...invoice.customer })
  const type = config?.issuerCondition === 'RI' ? [1, 6].includes(customer.vatConditionId) ? 'A' : 'B' : 'C'
  return <details><summary className='cursor-pointer text-sm font-medium'>Corregir datos del comprobante rechazado</summary><div className='space-y-3 pt-3'>
    <p className='text-xs'>La venta y sus importes se conservan. Se guardará el historial de esta corrección.</p>
    <Label htmlFor='correction-condition'>Condición de IVA</Label><select id='correction-condition' className='block w-full border rounded p-2' value={customer.vatConditionId} onChange={e => setCustomer({ ...customer, vatConditionId: Number(e.target.value) })}>
      <option value={5}>Consumidor final</option><option value={1}>Responsable inscripto</option><option value={6}>Monotributista</option><option value={4}>Exento</option><option value={15}>No alcanzado</option>
    </select>
    <Label htmlFor='correction-type'>Documento</Label><select id='correction-type' className='block border rounded p-2' value={customer.documentType} onChange={e => setCustomer({ ...customer, documentType: e.target.value as 'DNI' | 'CUIT' })}><option>DNI</option><option>CUIT</option></select>
    <Label htmlFor='correction-number'>Número</Label><Input id='correction-number' value={customer.documentNumber} onChange={e => setCustomer({ ...customer, documentNumber: e.target.value })} />
    <Label htmlFor='correction-name'>Nombre o razón social</Label><Input id='correction-name' value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
    <Label htmlFor='correction-address'>Domicilio</Label><Input id='correction-address' value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
    <Button disabled={disabled || !config?.configured} onClick={() => void onSave({ type, pointOfSale: config?.pointOfSale || 0, customer })}>Guardar corrección · Factura {type}</Button>
  </div></details>
}
