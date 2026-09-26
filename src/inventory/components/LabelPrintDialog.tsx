import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, ScanBarcode } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from '../../components'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import { prepareProductLabels, searchLabelProducts } from '../../services/barcode.service'
import { createLabelPdf, formatArs, getFinalLabelPrice, getLabelLayout, validateLabelBatch } from '../../services/labelDocument'
import { checkoutError } from '../../services/checkout'
import { LabelProduct, PreparedProductLabel } from '../../types/barcode.types'

function LabelPreview({ label, includePrice }: { label: PreparedProductLabel; includePrice: boolean }) {
  const layout = useMemo(() => {
    try { return getLabelLayout(label, includePrice) }
    catch { return null }
  }, [label, includePrice])
  if (!layout) return <p className='text-xs text-red-700'>Código incompatible. Elegí código interno.</p>
  const point = 25.4 / 72
  return <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className='mx-auto block w-[240px] max-w-full border bg-white text-black' role='img' aria-label={`Etiqueta de ${label.product.name}`}>
    <g fill='black' fontFamily='Helvetica, Arial, sans-serif' textAnchor='middle'>
      {layout.nameLines.map((line, index) => <text key={index} x={layout.centerX} y={layout.nameY + index * layout.nameLineHeight} fontSize={layout.nameFontSize * point} fontWeight='bold'>{line}</text>)}
      <text x={layout.centerX} y={layout.codeY} fontSize={5.5 * point}>Código {label.product.code}</text>
      {layout.bars.map((bar, index) => <rect key={index} x={bar.x} y={layout.barcodeY} width={bar.width} height={layout.barcodeHeight} />)}
      <text x={layout.centerX} y={layout.barcodeTextY} fontSize={layout.barcodeTextSize * point}>{label.barcode.value}</text>
      {includePrice && <text x={layout.centerX} y={layout.priceY} fontSize={8 * point} fontWeight='bold'>{formatArs(getFinalLabelPrice(label))}</text>}
    </g>
  </svg>
}

export function LabelPrintCenter({ initialProducts = [], active = true, initialCopies = {}, barcodeIds, fixedProducts = false }: {
  initialProducts?: LabelProduct[]
  active?: boolean
  initialCopies?: Record<string, number>
  barcodeIds?: Record<string, string>
  fixedProducts?: boolean
}) {
  const [queued, setQueued] = useState<LabelProduct[]>(() => [...new Map(initialProducts.map(p => [p._id, p])).values()])
  const [labels, setLabels] = useState<PreparedProductLabel[]>([])
  const [copies, setCopies] = useState<Record<string, number>>(() => Object.fromEntries(initialProducts.map(p => [p._id, initialCopies[p._id] ?? 1])))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LabelProduct[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [scanError, setScanError] = useState('')
  const [pendingScans, setPendingScans] = useState(0)
  const scanSession = useRef(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const searchInput = useRef<HTMLInputElement>(null)
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
  const desired = JSON.stringify([queued.map(p => p._id), preference, retry, barcodeIds])
  const [preparedFor, setPreparedFor] = useState('')
  useEffect(() => {
    let current = true
    setLabels([]); setPreparedFor(''); setError(''); setNotice('')
    if (!active || !queued.length) { setPreparing(false); return }
    setPreparing(true)
    const prepare = barcodeIds
      ? prepareProductLabels(queued.map(p => p._id), preference, barcodeIds)
      : prepareProductLabels(queued.map(p => p._id), preference)
    prepare
      .then(data => { if (current) { setLabels(data); setPreparedFor(desired) } })
      .catch(e => { if (current) setError(checkoutError(e)) })
      .finally(() => { if (current) setPreparing(false) })
    return () => { current = false }
  }, [desired, active])
  const add = useCallback((product: LabelProduct) => {
    setQueued(previous => previous.some(p => p._id === product._id) ? previous : [...previous, product])
    setCopies(previous => ({ ...previous, [product._id]: previous[product._id] || 1 }))
    searchInput.current?.focus()
  }, [])
  const search = useCallback(async (value: string) => {
    clearTimeout(searchTimer.current)
    if (!active || fixedProducts || lock.current || !value.trim()) return
    const version = ++searchVersion.current
    setSearching(true); setSearchError(''); setHasSearched(false); setResults([])
    try {
      const found = await searchLabelProducts(value.trim(), false)
      if (!mounted.current || version !== searchVersion.current) return
      setResults(found); setHasSearched(true)
    } catch (e) { if (mounted.current && version === searchVersion.current) setSearchError(checkoutError(e)) }
    finally { if (mounted.current && version === searchVersion.current) setSearching(false) }
  }, [active, fixedProducts])
  useEffect(() => {
    if (active && !fixedProducts && query.trim()) searchTimer.current = setTimeout(() => void search(query), 300)
    return () => { clearTimeout(searchTimer.current); searchVersion.current++ }
  }, [query, active, fixedProducts, search])
  const changeQuery = (value: string) => {
    clearTimeout(searchTimer.current); searchVersion.current++
    setQuery(value); setResults([]); setSearching(false); setHasSearched(false); setSearchError('')
  }
  useEffect(() => {
    setPendingScans(0)
    return () => { scanSession.current++ }
  }, [active, fixedProducts])
  useBarcodeScanner({ enabled: active && !fixedProducts && !printing, onScan: async value => {
    // Every scan is an explicit add, unlike replaceable name-search requests.
    // A second scan or new typing must not discard the first scanned product.
    const session = scanSession.current
    changeQuery(''); setScanError(''); setPendingScans(count => count + 1)
    try {
      const found = await searchLabelProducts(value, true)
      if (!mounted.current || session !== scanSession.current) return
      if (found.length === 1) add(found[0])
      else setScanError(found.length ? `El código ${value} coincide con varios productos. Buscá por nombre para elegir.` : `No se encontró el código ${value}. Podés buscar el producto por nombre.`)
    } catch (e) {
      if (mounted.current && session === scanSession.current) setScanError(checkoutError(e))
    } finally {
      if (mounted.current && session === scanSession.current) setPendingScans(count => count - 1)
    }
  } })
  let batchError = ''
  let total = 0
  try { if (labels.length) total = validateLabelBatch(labels, copies) } catch (e) { batchError = (e as Error).message }
  const ready = active && !!labels.length && preparedFor === desired && !preparing && !printing && !pendingScans && !batchError
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
    <p className='text-sm text-muted-foreground'>{fixedProducts ? 'Elegí cuántas etiquetas imprimir de este producto. Las copias no modifican el stock.' : 'Buscá productos, elegí cuántas etiquetas necesitás e imprimí. Esto no modifica el stock.'}</p>
    {!fixedProducts && <section className='space-y-3 rounded-lg border bg-card p-4' aria-label='Buscar y agregar productos'>
      <h2 className='font-semibold'>1. Buscá y agregá productos</h2>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Search className='pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
          <Input ref={searchInput} className='pl-9' aria-label='Buscar productos para etiquetas' aria-describedby='label-search-help' data-barcode-input value={query} disabled={printing} onChange={e => changeQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search(query) } }} placeholder='Nombre, código o código de barras' />
        </div>
        {query && <Button variant='ghost' disabled={printing} onClick={() => { changeQuery(''); searchInput.current?.focus() }}>Limpiar</Button>}
      </div>
      <p id='label-search-help' className='text-xs text-muted-foreground'>Los resultados aparecen mientras escribís. Probá con parte del nombre, sin preocuparte por tildes ni el orden de las palabras.</p>
      <p className='flex items-center gap-2 text-xs text-muted-foreground'><ScanBarcode className='h-4 w-4 shrink-0' />También podés escanear para agregar directamente. Cada producto se agrega una sola vez; ajustá sus copias abajo.</p>
      {searching && <p role='status' className='text-sm text-muted-foreground'>Buscando productos…</p>}
      {!!pendingScans && <p role='status' className='text-sm text-muted-foreground'>Identificando códigos escaneados…</p>}
      {scanError && <p role='alert' className='text-sm text-red-700'>{scanError}</p>}
      {searchError && <p role='alert' className='text-sm text-red-700'>{searchError} <Button variant='outline' onClick={() => void search(query)}>Reintentar búsqueda</Button></p>}
      {hasSearched && <p role='status' className='text-sm text-muted-foreground'>{results.length ? `${results.length} ${results.length === 1 ? 'producto encontrado' : 'productos encontrados'}${results.length === 30 ? ' · Mostramos los primeros 30. Afiná la búsqueda si falta el tuyo.' : ''}` : 'No se encontraron productos. Probá con menos palabras o con el código.'}</p>}
      {!!results.length && <ul aria-label='Resultados de productos' className='max-h-72 overflow-auto rounded border divide-y'>{results.map(product => <li key={product._id} className='flex items-center justify-between gap-3 p-3 text-sm'><div className='min-w-0'><p className='font-medium'>{product.name}</p><p className='text-xs text-muted-foreground'>Código: {product.code}</p></div><Button variant='outline' disabled={printing || queued.some(p => p._id === product._id)} onClick={() => add(product)}>{queued.some(p => p._id === product._id) ? 'Agregado' : 'Agregar'}</Button></li>)}</ul>}
      {!query.trim() && !searching && !pendingScans && !hasSearched && <p className='rounded-md bg-muted/40 p-4 text-center text-sm text-muted-foreground'>Escribí un nombre o escaneá un código para empezar.</p>}
    </section>}
    <div className={fixedProducts ? 'space-y-4' : 'space-y-4 rounded-lg border bg-card p-4'}>
      {!fixedProducts && <div className='flex flex-wrap items-center justify-between gap-2'><h2 className='font-semibold'>2. Elegí las copias e imprimí</h2><span className='text-sm text-muted-foreground'>{queued.length} {queued.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}</span></div>}
      <div className='space-y-3'>
        <p className='text-sm font-medium'>Etiquetas de 50 × 30 mm · Una unidad por código</p>
        {!barcodeIds && !fixedProducts && <details><summary className='cursor-pointer text-sm'>Opciones de etiqueta</summary><label className='mt-2 block text-sm'>Código a imprimir<select aria-label='Código a imprimir' className='mt-1 block w-full rounded border p-2' disabled={printing} value={preference} onChange={e => setPreference(e.target.value as typeof preference)}><option value='PRIMARY_OR_INTERNAL'>Principal unitario o interno</option><option value='INTERNAL'>Siempre código interno</option></select></label></details>}
        <label className='flex items-center gap-2 text-sm'><input type='checkbox' checked={includePrice} disabled={printing} onChange={e => setIncludePrice(e.target.checked)} />Incluir precio final de venta</label>
        <div className='max-h-64 overflow-auto rounded border'>
          {!queued.length && <p className='p-5 text-sm text-muted-foreground'>Agregá productos para armar el lote.</p>}
          {queued.map(product => <div key={product._id} className='flex items-center gap-2 border-b p-2'>
            <div className='min-w-0 flex-1'><p className='truncate text-sm font-medium'>{product.name}</p><p className='text-xs text-muted-foreground'>{product.code} · {labels.find(l => l.product._id === product._id)?.barcode.value || 'Pendiente'}</p></div>
            <label className='text-xs text-muted-foreground'>Copias<Input aria-label={`Copias de ${product.name}`} className='w-20' type='number' min={1} max={999} step={1} disabled={printing} value={copies[product._id] ?? 1} onChange={e => setCopies(current => ({ ...current, [product._id]: Number(e.target.value) }))} /></label>
            {!fixedProducts && <Button variant='ghost' disabled={printing} aria-label={`Quitar ${product.name}`} onClick={() => setQueued(current => current.filter(p => p._id !== product._id))}>Quitar</Button>}
          </div>)}
        </div>
        {preparing && <p role='status'>Preparando códigos y precios…</p>}
        {!!queued.length && <Button variant='outline' disabled={printing || preparing} onClick={() => setRetry(n => n + 1)}>Actualizar códigos y precios</Button>}
        {preview && <LabelPreview label={preview} includePrice={includePrice} />}
      </div>
    </div>
    {error && <p role='alert' className='text-sm text-red-700'>{error}</p>}
    {batchError && <p role='alert' className='text-sm text-red-700'>{batchError}</p>}
    {notice && <p role='status' className='text-sm'>{notice}</p>}
    <div className='flex flex-wrap items-center justify-between gap-3 border-t pt-3'><span className='text-sm'>{total} etiquetas · Máximo 1000 por lote</span><div className='flex gap-2'><Button variant='outline' disabled={!ready} onClick={() => void print(false)}>Ver PDF</Button><Button disabled={!ready} onClick={() => void print(true)}>{printing ? 'Preparando…' : 'Imprimir etiquetas'}</Button></div></div>
    <p className='text-xs text-muted-foreground'>Se abrirá la ventana de impresión habitual.</p>
  </div>
}

export function LabelPrintDialog({ open, onOpenChange, products, singleProduct = false }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: LabelProduct[]
  singleProduct?: boolean
}) {
  const selectedProducts = singleProduct ? products.slice(0, 1) : products
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={`max-h-[90vh] w-[96vw] overflow-y-auto ${singleProduct ? 'max-w-xl' : 'max-w-4xl'}`}>
      <DialogHeader>
        <DialogTitle>{singleProduct ? 'Imprimir etiqueta' : 'Centro de etiquetas'}</DialogTitle>
        <DialogDescription>{singleProduct ? `${products[0]?.code || ''} · ${products[0]?.name || ''}` : 'Prepará e imprimí etiquetas unitarias de productos.'}</DialogDescription>
      </DialogHeader>
      {open && <LabelPrintCenter key={singleProduct ? products[0]?._id : 'batch'} initialProducts={selectedProducts} active={open} fixedProducts={singleProduct} />}
    </DialogContent>
  </Dialog>
}
