import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components'
import FiscalCorrectionForm from './FiscalCorrectionForm'
import { Invoice } from '../../types/sale.types'
import { checkoutError, correctFiscalInvoice, FiscalInvoiceStatus, getFiscalInvoice, processFiscalInvoice } from '../../services/checkout'
import { previewReceipt, printThermal } from '../../services/receiptPrinting'
const labels = { PENDING: 'Pendiente de autorizar', PROCESSING: 'Procesando en ARCA', UNCERTAIN: 'Pendiente de conciliación', REJECTED: 'Rechazada por ARCA', AUTHORIZED: 'Autorizada por ARCA' }
export default function ReceiptActions({ saleId, invoice, initialFiscal, autoProcess = false }: { saleId: string; invoice: Invoice; initialFiscal?: FiscalInvoiceStatus | null; autoProcess?: boolean }) {
  const fiscal = !['X', 'TICKET'].includes(invoice.type)
  const cache = useQueryClient()
  const { data, error: statusError } = useQuery({ queryKey: ['fiscal', saleId], queryFn: () => getFiscalInvoice(saleId), enabled: fiscal, initialData: initialFiscal || undefined, retry: false, refetchInterval: query => query.state.data && ['PENDING', 'PROCESSING', 'UNCERTAIN'].includes(query.state.data.status) ? 15000 : false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const running = useRef(false)
  const started = useRef(false)
  const run = async (operation: () => Promise<unknown>) => {
    if (running.current) return
    running.current = true
    setBusy(true); setError(''); setNotice('')
    try { await operation() } catch (e) { setError(checkoutError(e)) } finally { running.current = false; setBusy(false) }
  }
  const process = async () => {
    const status = await processFiscalInvoice(saleId)
    cache.setQueryData(['fiscal', saleId], status)
  }
  useEffect(() => {
    if (autoProcess && fiscal && !started.current && initialFiscal?.status === 'PENDING') { started.current = true; void run(process) }
  }, [autoProcess, fiscal, saleId])
  const printable = !fiscal || data?.status === 'AUTHORIZED'
  return <section className='space-y-3 rounded-xl border p-4' aria-label='Emisión e impresión'>
    <h3 className='font-semibold'>{fiscal ? `Factura ${{ 1: 'A', 6: 'B', 11: 'C' }[data?.payload?.CbteTipo || 0] || invoice.type} · ${data ? labels[data.status] : 'Consultando estado'}` : 'Comprobante interno · No válido como factura'}</h3>
    {data?.environment === 'homologation' && <p className='text-sm text-amber-800'>Homologación · Sin validez fiscal</p>}
    {data?.cae && <p className='text-sm'>CAE {data.cae} · Número {data.number}</p>}
    {data?.message && !printable && <p className='text-sm'>{data.message}</p>}
    {fiscal && !printable && <p className='text-sm text-muted-foreground'>La venta ya está guardada. Recuperá la autorización desde aquí, incluso después de cerrar esta pantalla.</p>}
    {fiscal && !printable && data?.status !== 'REJECTED' && <Button disabled={busy} onClick={() => void run(process)}>{busy ? 'Consultando ARCA…' : 'Consultar / recuperar autorización'}</Button>}
    {data?.blockedBy && data.blockedBy !== saleId && <p className='text-sm'>Primero resolvé el comprobante de la venta <a className='underline' href={`/sale/${data.blockedBy}`}>{data.blockedBy}</a>.</p>}
    {data?.status === 'REJECTED' && <FiscalCorrectionForm invoice={invoice} disabled={busy} onSave={updated => run(async () => { cache.setQueryData(['fiscal', saleId], await correctFiscalInvoice(saleId, updated)); await process() })} />}
    {statusError && <p role='alert' className='text-sm text-red-700'>{checkoutError(statusError)}</p>}
    {printable && <>
      <div className='flex flex-wrap gap-2'><Button variant='outline' disabled={busy} onClick={() => void run(() => previewReceipt(saleId, 'thermal'))}>Ver ticket</Button><Button variant='outline' disabled={busy} onClick={() => void run(() => previewReceipt(saleId, 'a4'))}>Ver factura</Button></div>
      <Button disabled={busy} onClick={() => void run(async () => {
        try { await printThermal(saleId) }
        catch { throw new Error('No se pudo imprimir el ticket. Revisá que haya papel y que la impresora esté encendida. Si continúa, avisá al administrador.') }
        setNotice('Ticket enviado a imprimir. Comprobá que haya salido antes de volver a imprimir.')
      })}>Imprimir ticket</Button>
    </>}
    {error && <p role='alert' className='text-sm text-red-700'>{error} La venta permanece guardada.</p>}
    {notice && <p role='status' className='text-sm'>{notice}</p>}
  </section>
}
