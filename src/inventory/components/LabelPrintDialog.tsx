import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '../../components'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { prepareProductLabels, searchLabelProducts } from '../../services/barcode.service'
import { createLabelPdf, formatArs, getFinalLabelPrice, validateLabelBatch } from '../../services/labelDocument'
import { checkoutError } from '../../services/checkout'
import { LabelProduct, PreparedProductLabel } from '../../types/barcode.types'

function BarcodePreview({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    try { if (ref.current) JsBarcode(ref.current, value, { format: 'CODE128', displayValue: true, width: 2, height: 40, margin: 12, fontSize: 12 }); setError(false) }
    catch { setError(true) }
  }, [value])
  return error ? <p className='text-xs text-red-700'>Código incompatible. Elegí código interno.</p> : <svg ref={ref} className='max-h-16 w-full' aria-label={`Código ${value}`} />
}

export function LabelPrintCenter({ initialProducts = [], active = true }: { initialProducts?: LabelProduct[]; active?: boolean }) {
  const [queued, setQueued] = useState<LabelProduct[]>(() => [...new Map(initialProducts.map(p => [p._id, p])).values()])
  const [labels, setLabels] = useState<PreparedProductLabel[]>([])
  const [copies, setCopies] = useState<Record<string, number>>(() => Object.fromEntries(initialProducts.map(p => [p._id, 1])))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LabelProduct[]>([])
  const [preference, setPreference] = useState<'PRIMARY_OR_INTERNAL' | 'INTERNAL'>('PRIMARY_OR_INTERNAL')
  const [includePrice, setIncludePrice] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const searchVersion = useRef(0)
  const lock = useRef(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; searchVersion.current++ } }, [])
  // Fingerprint prevents a one-frame stale print when a queue/preference edit occurs.
  const desired = JSON.stringify([queued.map(p => p._id), preference, retry])
  const [preparedFor, setPreparedFor] = useState('')
  useEffect(() => {
    let current = true
    setLabels([]); setPreparedFor(''); setError(''); setNotice('')
    if (!active || !queued.length) { setPreparing(false); return }
    setPreparing(true)
    prepareProductLabels(queued.map(p => p._id), preference)
      .then(data => { if (current) { setLabels(data); setPreparedFor(desired) } })
      .catch(e => { if (current) setError(checkoutError(e)) })
      .finally(() => { if (current) setPreparing(false) })
    return () => { current = false }
  }, [desired, active])
  const add = (product: LabelProduct) => {
    setQueued(previous => previous.some(p => p._id === product._id) ? previous : [...previous, product])
    setCopies(previous => ({ ...previous, [product._id]: previous[product._id] || 1 }))
    setQuery(''); setResults([]); setSearching(false); searchVersion.current++
  }
  const search = async (value = query, exact = false) => {
    if (!active || lock.current || !value.trim()) return
    const version = ++searchVersion.current
    setSearching(true); setError('')
    try {
      const found = await searchLabelProducts(value, exact)
      if (!mounted.current || version !== searchVersion.current) return
      if (exact && found.length === 1) add(found[0])
      else { setResults(found); if (!found.length) setNotice('No se encontraron productos.') }
    } catch (e) { if (mounted.current && version === searchVersion.current) setError(checkoutError(e)) }
    finally { if (mounted.current && version === searchVersion.current) setSearching(false) }
  }
  useBarcodeScanner({ enabled: active && !printing && !searching, onScan: value => search(value, true) })
  let batchError = ''
  let total = 0
  try { if (labels.length) total = validateLabelBatch(labels, copies) } catch (e) { batchError = (e as Error).message }
  const ready = active && !!labels.length && preparedFor === desired && !preparing && !printing && !batchError
  const print = async (direct: boolean) => {
    if (lock.current || !ready) return
    lock.current = true; setPrinting(true); setError(''); setNotice('')
    let popup: Window | null = null
    try {
      popup = window.open('', '_blank')
      if (!popup) throw new Error('Permití abrir una ventana para imprimir las etiquetas.')
      popup.opener = null
      const pdf = createLabelPdf(labels, copies, includePrice)
      // Preserve the existing native PDF printing flow. No QZ or printer selection.
      if (direct) pdf.autoPrint()
      const url = URL.createObjectURL(pdf.output('blob'))
      popup.location.replace(url)
      window.setTimeout(() => URL.revokeObjectURL(url), 120000)
    } catch (e) { popup?.close(); setError(checkoutError(e)) }
    finally { lock.current = false; if (mounted.current) setPrinting(false) }
  }
  const preview = labels[0]
  return <div className='space-y-4'>
    <p className='text-sm text-muted-foreground'>Buscá por nombre o código, o escaneá el producto. Podés volver a imprimir sus etiquetas sin modificar el stock.</p>
    <div className='flex gap-2'>
      <Input aria-label='Buscar productos para etiquetas' data-barcode-input value={query} disabled={printing} onChange={e => { setQuery(e.target.value); setResults([]); setSearching(false); searchVersion.current++; setNotice('') }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search() } }} placeholder='Nombre, código o código de barras' />
      <Button variant='outline' disabled={printing || searching || !query.trim()} onClick={() => void search()}>{searching ? 'Buscando…' : 'Buscar'}</Button>
    </div>
    {!!results.length && <ul className='max-h-44 overflow-auto rounded border'>{results.map(product => <li key={product._id} className='flex items-center justify-between gap-3 border-b p-2 text-sm'><span>{product.name} · {product.code}</span><Button variant='outline' disabled={printing || queued.some(p => p._id === product._id)} onClick={() => add(product)}>{queued.some(p => p._id === product._id) ? 'Agregado' : 'Agregar'}</Button></li>)}</ul>}
    <div className='space-y-4'>
      <div className='space-y-3'>
        <p className='text-sm font-medium'>Etiquetas de 50 × 30 mm · Una unidad por código</p>
        <details><summary className='cursor-pointer text-sm'>Opciones de etiqueta</summary><label className='mt-2 block text-sm'>Código a imprimir<select aria-label='Código a imprimir' className='mt-1 block w-full rounded border p-2' disabled={printing} value={preference} onChange={e => setPreference(e.target.value as typeof preference)}><option value='PRIMARY_OR_INTERNAL'>Principal unitario o interno</option><option value='INTERNAL'>Siempre código interno</option></select></label></details>
        <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={includePrice} disabled={printing} onChange={e => setIncludePrice(e.target.checked)} />Incluir precio final de venta</label>
        <div className='max-h-64 overflow-auto rounded border'>
          {!queued.length && <p className='p-5 text-sm text-muted-foreground'>Agregá productos para armar el lote.</p>}
          {queued.map(product => <div key={product._id} className='flex items-center gap-2 border-b p-2'>
            <div className='min-w-0 flex-1'><p className='truncate text-sm font-medium'>{product.name}</p><p className='text-xs text-muted-foreground'>{product.code} · {labels.find(l => l.product._id === product._id)?.barcode.value || 'Pendiente'}</p></div>
            <Input aria-label={`Copias de ${product.name}`} className='w-20' type='number' min={1} max={999} step={1} disabled={printing} value={copies[product._id] ?? 1} onChange={e => setCopies(current => ({ ...current, [product._id]: Number(e.target.value) }))} />
            <Button variant='ghost' disabled={printing} aria-label={`Quitar ${product.name}`} onClick={() => setQueued(current => current.filter(p => p._id !== product._id))}>Quitar</Button>
          </div>)}
        </div>
        {preparing && <p role='status'>Preparando códigos y precios…</p>}
        {!!queued.length && <Button variant='outline' disabled={printing || preparing} onClick={() => setRetry(n => n + 1)}>Actualizar códigos y precios</Button>}
        {preview && <div className='mx-auto flex w-[240px] flex-col items-center overflow-hidden border bg-white p-2 text-black' style={{ aspectRatio: '50/30' }}><p className='line-clamp-2 text-center text-xs font-bold'>{preview.product.name}</p><p className='text-[9px]'>{preview.product.code}</p><BarcodePreview value={preview.barcode.value} />{includePrice && <p className='text-xs font-bold'>{formatArs(getFinalLabelPrice(preview))}</p>}</div>}
      </div>
    </div>
    {error && <p role='alert' className='text-sm text-red-700'>{error}</p>}
    {batchError && <p role='alert' className='text-sm text-red-700'>{batchError}</p>}
    {notice && <p role='status' className='text-sm'>{notice}</p>}
    <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'><span className='text-sm'>{total} etiquetas · Máximo 1000 por lote</span><div className='flex gap-2'><Button variant='outline' disabled={!ready} onClick={() => void print(false)}>Ver PDF</Button><Button disabled={!ready} onClick={() => void print(true)}>{printing ? 'Preparando…' : 'Imprimir etiquetas'}</Button></div></div>
    <p className='text-xs text-muted-foreground'>Se abrirá la ventana de impresión habitual.</p>
  </div>
}

export function LabelPrintDialog({ open, onOpenChange, products }: { open: boolean; onOpenChange: (open: boolean) => void; products: LabelProduct[] }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className='max-h-[90vh] w-[96vw] max-w-4xl overflow-y-auto'><DialogHeader><DialogTitle>Centro de etiquetas</DialogTitle><DialogDescription>Prepará e imprimí etiquetas unitarias de productos.</DialogDescription></DialogHeader>{open && <LabelPrintCenter initialProducts={products} active={open} />}</DialogContent></Dialog>
}
