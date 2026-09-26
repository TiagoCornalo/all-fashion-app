import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import { useSaleStore } from '../../stores/saleStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button, Input } from '../../components'
import { ProductSelector, PaymentForm, InvoiceForm, ComboSelector, PromotionApplier } from './sale'
import { buildCheckoutRequest, paymentLabels, validateCheckoutDraft } from '../checkoutDomain'
import { CheckoutPreview, CheckoutRequest, CheckoutResult, checkoutError, previewCheckout, submitCheckout } from '../../services/checkout'
import ReceiptActions from './ReceiptActions'

const money = (value: number) => value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
type Pending = { key: string; request: CheckoutRequest }
const storageKey = () => {
  try { return `checkout-pending:${JSON.parse(localStorage.getItem('user') || '{}')._id || 'session'}` } catch { return 'checkout-pending:session' }
}
function readPending(): Pending | null {
  try { return JSON.parse(sessionStorage.getItem(storageKey()) || 'null') } catch { return null }
}

export default function NewSaleDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const state = useSaleStore()
  const { currentRegister, fetchCurrentRegister } = useCashRegisterStore()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)
  const [error, setError] = useState('')
  const [quote, setQuote] = useState<{ data: CheckoutPreview; fingerprint: string; request: CheckoutRequest } | null>(null)
  const [pending, setPending] = useState<Pending | null>(readPending)
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [receiptSent, setReceiptSent] = useState(false)
  const [draftVersion, setDraftVersion] = useState(0)
  const request = buildCheckoutRequest(state, currentRegister?._id || '')
  const fingerprint = JSON.stringify(request)
  const reviewed = quote?.fingerprint === fingerprint ? quote : null
  const transfer = reviewed?.data.payments.find(p => p.method === 'TRANSFER')
  useEffect(() => { setReceiptSent(false) }, [fingerprint, quote])
  const locked = busy || Boolean(pending)

  const review = async () => {
    if (inFlight.current) return
    const invalid = validateCheckoutDraft(useSaleStore.getState(), currentRegister?._id)
    if (invalid) { setError(invalid); return }
    inFlight.current = true; setBusy(true); setError(''); setQuote(null)
    try {
      let nextRequest = buildCheckoutRequest(useSaleStore.getState(), currentRegister!._id)
      let data = await previewCheckout(nextRequest)
      // Keep the catalogue and the visible cart aligned with authoritative ARS prices.
      useSaleStore.setState(s => ({ items: data.items.map(item => ({ ...s.items.find(i => i.product === item.product), ...item })),
        combos: data.combos.map(combo => ({ comboId: combo.comboId, quantity: combo.quantity, name: combo.name, price: combo.totalPrice / combo.quantity })),
        total: data.subtotal,
        paymentAmounts: s.selectedMethods.length === 1 ? { [s.selectedMethods[0]]: data.subtotal } : s.paymentAmounts,
        remaining: s.selectedMethods.length === 1 ? 0 : data.remaining }))
      nextRequest = buildCheckoutRequest(useSaleStore.getState(), currentRegister!._id)
      if (JSON.stringify(nextRequest) !== fingerprint) data = await previewCheckout(nextRequest)
      setQuote({ data, fingerprint: JSON.stringify(nextRequest), request: nextRequest })
      if (data.remaining !== 0) setError(`Distribuí los pagos sobre el subtotal actualizado. Diferencia: ${money(data.remaining)}.`)
    } catch (e) { setError(checkoutError(e)) }
    finally { setBusy(false); inFlight.current = false }
  }
  const confirm = async () => {
    if (inFlight.current || (!pending && (!reviewed || reviewed.data.remaining !== 0 || (transfer && !receiptSent)))) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      const operation = pending || { key: crypto.randomUUID(), request: { ...reviewed!.request, previewHash: reviewed!.data.previewHash } }
      // Persist BEFORE sending. A lost response must reuse the same payload and key.
      sessionStorage.setItem(storageKey(), JSON.stringify(operation))
      setPending(operation)
      const saved = await submitCheckout(operation.request, operation.key)
      sessionStorage.removeItem(storageKey()); setPending(null); setResult(saved)
      useSaleStore.getState().clearSale(); setQuote(null)
      void queryClient.invalidateQueries({ queryKey: ['sales'] })
    } catch (e) {
      const status = (e as { response?: { status?: number } }).response?.status
      if (status && [400, 403, 404, 409, 422].includes(status)) {
        sessionStorage.removeItem(storageKey()); setPending(null); setQuote(null)
      }
      setError(checkoutError(e))
    } finally { setBusy(false); inFlight.current = false }
  }
  const close = () => {
    if (busy) return
    onOpenChange(false)
    if (result) { setResult(null); setDraftVersion(v => v + 1); void fetchCurrentRegister() }
  }
  const newSale = () => { setResult(null); setError(''); setDraftVersion(v => v + 1); void fetchCurrentRegister() }

  return <Dialog open={isOpen} onOpenChange={open => { if (!open) close() }}>
    <DialogContent className='w-[98vw] max-w-7xl h-[94dvh] flex flex-col p-4 sm:p-6' onInteractOutside={e => e.preventDefault()} onEscapeKeyDown={e => { if (locked) e.preventDefault() }}>
      <DialogHeader><DialogTitle>{result ? 'Venta registrada' : 'Nueva venta'}</DialogTitle><DialogDescription>{result ? 'La venta y el stock ya están guardados.' : 'Productos, pagos y comprobante en un solo lugar. Importes en pesos argentinos.'}</DialogDescription></DialogHeader>
      {result ? <div className='flex-1 overflow-auto space-y-5 py-4'>
        <div className='rounded-xl border bg-green-50 p-5 text-green-950'><p className='text-2xl font-semibold'>{money(result.sale.total)}</p><p>Venta {result.sale._id.slice(0, 8)}</p>{result.sale.payments.some(p => p.method === 'TRANSFER') && <p className='mt-2 text-sm'>La transferencia sigue pendiente de verificación en el flujo habitual.</p>}</div>
        {result.metadata?.warning && <p role='status'>{result.metadata.warning}</p>}
        <ReceiptActions saleId={result.sale._id} invoice={result.sale.invoice} initialFiscal={result.fiscal} autoProcess />
        <div className='flex gap-2'><Button onClick={newSale}>Nueva venta</Button><Button variant='outline' onClick={close}>Volver a caja</Button></div>
      </div> : <>
        {pending && !busy && <div role='alert' className='rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950'>Hay un cobro cuya respuesta está pendiente. Consultá y recuperá esta misma operación antes de iniciar otra venta. Identificador: {pending.key}</div>}
        {error && <div role='alert' className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800'>{error}</div>}
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <fieldset disabled={locked} className='grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)] disabled:opacity-70' key={draftVersion}>
            <section className='min-w-0 space-y-4' aria-label='Carrito'>
              <ProductSelector scannerEnabled={isOpen && !locked} />
              <details className='rounded-xl border p-3' open={state.combos.length > 0 || undefined}><summary className='cursor-pointer font-medium'>Combos</summary><ComboSelector /></details>
              <details className='rounded-xl border p-3' open={Boolean(state.promotionCode || state.itemPromotions.length) || undefined}><summary className='cursor-pointer font-medium'>Promociones y descuentos</summary><PromotionApplier /></details>
              <label className='block text-sm'>Notas de la venta<Input value={state.notes} onChange={e => state.setNotes(e.target.value)} placeholder='Opcional' className='mt-1' /></label>
            </section>
            <section className='min-w-0 space-y-4' aria-label='Cobro y facturación'>
              <PaymentForm />
              <div className='rounded-xl border p-4'><InvoiceForm /></div>
              <div className='rounded-xl border bg-accent/40 p-4 space-y-3' aria-live='polite'>
                <p className='text-sm font-medium'>{reviewed ? 'Importes revisados por el servidor' : 'Subtotal estimado · Revisar antes de cobrar'}</p>
                <p className='text-3xl font-semibold tracking-tight'>{money(reviewed?.data.total ?? state.total)}</p>
                {reviewed && <>
                  <p className='text-sm'>Productos y combos: {money(reviewed.data.subtotal)} · Recargos: {money(reviewed.data.total - reviewed.data.subtotal)}</p>
                  {reviewed.data.payments.map(payment => <div className='flex justify-between gap-3 text-sm' key={payment.method}><span>{paymentLabels[payment.method]}</span><strong>{money(payment.amount)}</strong></div>)}
                  {reviewed.data.installmentPlans.map((plan, i) => <p key={i} className='text-sm'>Cuenta corriente: {plan.label}. Capital {money(plan.baseAmount)}, intereses {money(plan.interestAmount)}. Total financiado {money(plan.totalWithInterest)}.</p>)}
                  {transfer && <label className='flex items-start gap-2 text-sm'><input type='checkbox' className='mt-1' checked={receiptSent} onChange={e => setReceiptSent(e.target.checked)} />El cliente envió el comprobante de transferencia por {money(transfer.amount)}. Queda pendiente de verificación.</label>}
                </>}
              </div>
            </section>
          </fieldset>
        </div>
        <footer className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'>
          <Button variant='outline' disabled={busy} onClick={close}>Cerrar</Button>
          <span className='text-xs text-muted-foreground'>{pending ? 'La recuperación no genera una segunda venta.' : 'Al cerrar conservás el borrador en esta sesión.'}</span>
          {pending ? <Button onClick={confirm} disabled={busy}>{busy ? 'Recuperando…' : 'Consultar y recuperar cobro'}</Button> : reviewed && reviewed.data.remaining === 0 ? <Button onClick={confirm} disabled={busy || Boolean(transfer && !receiptSent)}>{busy ? 'Guardando…' : `Confirmar venta · ${money(reviewed.data.total)}`}</Button> : <Button onClick={review} disabled={busy}>{busy ? 'Revisando…' : 'Revisar y continuar'}</Button>}
        </footer>
      </>}
    </DialogContent>
  </Dialog>
}
