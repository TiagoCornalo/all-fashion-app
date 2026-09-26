import { useEffect, useRef, useState } from 'react'
import { AxiosError } from 'axios'
import { Barcode, Printer, ScanBarcode, Trash2, WandSparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, Input, Label, Textarea
} from '../../components'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import {
  addProductBarcode, createInventoryReceipt, deactivateProductBarcode,
  generateInternalProductBarcode, getProductBarcodes
} from '../../services/barcode.service'
import { authService } from '../../services/auth.service'
import { ProductBarcode } from '../../types/barcode.types'
import { Product } from '../../types/inventory.types'
import { LabelPrintCenter } from './LabelPrintDialog'

interface BarcodeManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onUpdated: () => void | Promise<void>
}

type PendingReceipt = Parameters<typeof createInventoryReceipt>[0]
const errorMessage = (error: unknown) => error instanceof AxiosError
  ? error.response?.data?.details || error.response?.data?.error || error.message
  : error instanceof Error ? error.message : 'No se pudo completar la operación'

function readPending(key: string): PendingReceipt | null {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') } catch { return null }
}

export function BarcodeManagerDialog(props: BarcodeManagerDialogProps) {
  // A new product/open session gets its own draft; pending stock writes survive in sessionStorage.
  return props.open && props.product
    ? <ProductInventoryDialog key={props.product._id} {...props} product={props.product} />
    : null
}

function ProductInventoryDialog({ product, onOpenChange, onUpdated }: BarcodeManagerDialogProps & { product: Product }) {
  const user = authService.getCurrentUser()
  const canManageCodes = ['ADMIN', 'MANAGER'].includes(user?.role || '')
  const storageKey = `product-inventory-pending:${user?._id || 'session'}:${product._id}`
  const [pending, setPending] = useState<PendingReceipt | null>(() => readPending(storageKey))
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [value, setValue] = useState('')
  const [quantity, setQuantity] = useState(() => String(pending?.items[0]?.quantity || ''))
  const [notes, setNotes] = useState(pending?.notes || '')
  const [stock, setStock] = useState(product.stock)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showPrint, setShowPrint] = useState(false)
  const [labelCopies, setLabelCopies] = useState(1)
  const [printVersion, setPrintVersion] = useState(0)
  const lock = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const initialPending = useRef(pending)
  const selected = barcodes.find(code => code._id === selectedId)
  const amount = Number(quantity)
  const validAmount = Number.isInteger(amount) && amount > 0 && amount <= 100000
  const locked = busy || loading || !!pending
  const printable = selected?.unitsPerScan === 1 && /^[\x20-\x7e]{3,40}$/.test(selected.value)
    && selected.format !== 'QR'

  useEffect(() => {
    let active = true
    getProductBarcodes(product._id).then(codes => {
      if (!active) return
      setBarcodes(codes)
      const previous = codes.find(code => code.value === initialPending.current?.items[0]?.barcodeValue)
      setSelectedId((previous || codes.find(code => code.unitsPerScan === 1) || codes[0])?._id || '')
    }).catch(e => { if (active) setError(errorMessage(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [product._id])

  useEffect(() => { if (!loading && canManageCodes && !initialPending.current) inputRef.current?.focus() }, [loading, canManageCodes])

  const refreshTable = async () => {
    try { await onUpdated() }
    catch { toast.warning('Los cambios se guardaron. Actualizá la tabla para verlos.') }
  }

  const useCode = (code: ProductBarcode) => {
    setBarcodes(current => [...current.filter(item => item._id !== code._id), code])
    setSelectedId(code._id || '')
    setValue('')
    setShowPrint(false)
    setNotice('Código listo. Cada lectura de este código suma una unidad.')
  }

  const saveCode = async (rawValue: string) => {
    const captured = rawValue.trim()
    if (!captured || lock.current || locked || !canManageCodes) return
    lock.current = true
    // Consume input synchronously so a second Enter cannot submit this same read.
    if (inputRef.current) inputRef.current.value = ''
    setValue(''); setBusy(true); setError(''); setNotice('')
    try {
      const existing = barcodes.find(code => code.normalizedValue === captured.toUpperCase())
      if (existing) {
        setSelectedId(existing._id || ''); setShowPrint(false)
        setNotice('Este código ya está asociado al producto. Podés cargar la cantidad recibida.')
      } else {
        useCode(await addProductBarcode(product._id, {
          value: captured, origin: 'MANUFACTURER', unitsPerScan: 1, isPrimary: barcodes.length === 0
        }))
        await refreshTable()
      }
    } catch (e) { setValue(captured); setError(errorMessage(e)) }
    finally { lock.current = false; setBusy(false) }
  }

  useBarcodeScanner({ enabled: canManageCodes && !locked && !showPrint, onScan: saveCode })

  const generate = async () => {
    if (lock.current || locked || !canManageCodes) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try { useCode(await generateInternalProductBarcode(product._id)); await refreshTable() }
    catch (e) { setError(errorMessage(e)) }
    finally { lock.current = false; setBusy(false) }
  }

  const deactivate = async (code: ProductBarcode) => {
    if (!code._id || lock.current || locked || !canManageCodes) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try {
      await deactivateProductBarcode(product._id, code._id)
      const remaining = barcodes.filter(item => item._id !== code._id)
      setBarcodes(remaining)
      if (selectedId === code._id) setSelectedId(remaining[0]?._id || '')
      setShowPrint(false)
      setNotice('Código desactivado. El stock no cambió.')
      await refreshTable()
    } catch (e) { setError(errorMessage(e)) }
    finally { lock.current = false; setBusy(false) }
  }

  const confirmReceipt = async () => {
    if (lock.current || (!pending && (!selected || !validAmount || value.trim()))) return
    lock.current = true; setBusy(true); setError(''); setNotice(''); setShowPrint(false)
    try {
      const operation = pending || {
        idempotencyKey: crypto.randomUUID(),
        items: [{ productId: product._id, barcodeValue: selected!.value, quantity: amount }],
        notes: notes.trim() || undefined
      }
      // Persist the immutable payload before sending. A lost response must not cause another receipt.
      sessionStorage.setItem(storageKey, JSON.stringify(operation))
      setPending(operation)
      const result = await createInventoryReceipt(operation)
      const line = result.receipt.items.find(item =>
        (typeof item.product === 'string' ? item.product : item.product._id) === product._id)
      if (!line) throw new Error('No pudimos verificar el ingreso. Consultá nuevamente la misma operación.')
      sessionStorage.removeItem(storageKey)
      setPending(null)
      setStock(typeof line.product === 'object' ? line.product.stock : line.stockAfter)
      setQuantity(''); setNotes('')
      setLabelCopies(Math.min(line.quantity, 999)); setPrintVersion(version => version + 1)
      setNotice(`Ingreso confirmado: +${line.quantity} unidades. Ya podés imprimir las etiquetas.${line.quantity > 999 ? ' Imprimí en lotes de hasta 999 copias.' : ''}`)
      setShowPrint(true)
      await refreshTable()
    } catch (e) {
      const status = e instanceof AxiosError ? e.response?.status : undefined
      if (status && [400, 403, 404, 409, 422].includes(status)) {
        sessionStorage.removeItem(storageKey); setPending(null)
      }
      setError(errorMessage(e))
    } finally { lock.current = false; setBusy(false) }
  }

  return <Dialog open onOpenChange={next => { if (!lock.current) onOpenChange(next) }}>
    <DialogContent className='max-h-[92dvh] w-[96vw] max-w-3xl overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2'><Barcode className='h-5 w-5' />Códigos, stock y etiquetas</DialogTitle>
        <DialogDescription>{product.code} · {product.name}</DialogDescription>
      </DialogHeader>
      <div className='flex items-center justify-between rounded-lg bg-muted p-3'>
        <span className='text-sm'>Stock actual</span><strong className='text-xl'>{stock} unidades</strong>
      </div>
      {pending && <p role='status' className='rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950'>Hay un ingreso de {pending.items[0]?.quantity} unidades pendiente de confirmación. Consultá el resultado antes de cargar otro ingreso.</p>}
      {error && <p role='alert' className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800'>{error}</p>}
      {notice && <p role='status' className='rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900'>{notice}</p>}

      <section className='space-y-3 rounded-lg border p-4' aria-label='Código del producto'>
        <h3 className='font-semibold'>1. Identificar el producto</h3>
        {canManageCodes && <>
          <p className='text-sm text-muted-foreground'>Escaneá el código del fabricante para asociarlo a este producto, o generá uno propio.</p>
          <Label htmlFor='new-barcode'>Código del fabricante</Label>
          <div className='flex gap-2'>
            <div className='relative min-w-0 flex-1'>
              <Input ref={inputRef} id='new-barcode' data-barcode-input autoFocus disabled={locked} value={value}
                onChange={event => { setValue(event.target.value); setShowPrint(false) }}
                onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void saveCode(event.currentTarget.value) } }}
                placeholder='Escanear o escribir y presionar Enter' className='pr-9' />
              <ScanBarcode className='absolute right-3 top-2.5 h-4 w-4 text-muted-foreground' />
            </div>
            <Button disabled={locked || !value.trim()} onClick={() => void saveCode(value)}>Guardar código</Button>
          </div>
          <Button variant='outline' disabled={locked} onClick={() => void generate()}><WandSparkles className='mr-2 h-4 w-4' />Generar código interno</Button>
          <p className='text-xs text-muted-foreground'>Los nuevos códigos representan 1 unidad por lectura. La cantidad de mercadería se carga abajo.</p>
        </>}
        {loading ? <p role='status'>Cargando códigos…</p> : !barcodes.length ? <p className='text-sm text-muted-foreground'>{canManageCodes ? 'Todavía no hay códigos asociados.' : 'Un administrador o encargado debe asociar un código a este producto.'}</p> :
          <div className='max-h-40 divide-y overflow-auto rounded border'>{barcodes.map(code => <div className='flex items-center gap-2 p-2' key={code._id}>
            <label className='flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm'>
              <input type='radio' name='product-barcode' value={code._id} checked={selectedId === code._id} disabled={locked}
                onChange={() => { setSelectedId(code._id || ''); setShowPrint(false) }} />
              <span className='break-all font-mono'>{code.value}</span>
              <Badge variant='outline'>{code.origin === 'INTERNAL' ? 'Interno' : 'Fabricante'}</Badge>
              {code.unitsPerScan > 1 && <Badge variant='warning'>{code.unitsPerScan} unidades por lectura</Badge>}
            </label>
            {canManageCodes && <Button variant='ghost' size='icon' disabled={locked} aria-label={`Desactivar ${code.value}`} onClick={() => void deactivate(code)}><Trash2 className='h-4 w-4 text-destructive' /></Button>}
          </div>)}</div>}
      </section>

      <section className='space-y-3 rounded-lg border p-4' aria-label='Ingreso de stock'>
        <h3 className='font-semibold'>2. Cargar mercadería recibida</h3>
        <p className='text-sm text-muted-foreground'>Ingresá las unidades que llegaron. Se suman al stock actual. Si corresponden a un pedido, ingresalas desde la verificación de ese pedido.</p>
        <Label htmlFor='received-quantity'>Cantidad recibida</Label>
        <Input ref={quantityRef} id='received-quantity' type='number' min={1} max={100000} step={1} disabled={locked} value={quantity} placeholder='Ej.: 10'
          onChange={event => { setQuantity(event.target.value); setShowPrint(false); setNotice('') }} />
        {quantity && !validAmount && <p className='text-sm text-red-700'>Ingresá una cantidad entera entre 1 y 100000.</p>}
        {validAmount && !pending && <p className='text-sm'>Stock previsto: {stock} + {amount} = <strong>{stock + amount} unidades</strong></p>}
        <Textarea aria-label='Nota del ingreso' value={notes} disabled={locked} onChange={event => setNotes(event.target.value)} placeholder='Nota del ingreso (opcional)' />
        <Button disabled={busy || loading || (!pending && (!selected || !validAmount || !!value.trim()))} onClick={() => void confirmReceipt()}>
          {busy ? 'Guardando…' : pending ? 'Consultar ingreso pendiente' : 'Confirmar ingreso de stock'}
        </Button>
      </section>

      <section className='space-y-3 rounded-lg border p-4' aria-label='Etiquetas del producto'>
        <h3 className='font-semibold'>3. Imprimir etiquetas</h3>
        {selected && !printable && <p className='text-sm text-amber-800'>Para imprimir etiquetas individuales, elegí un código unitario compatible o generá uno interno.</p>}
        {!showPrint && <Button variant='outline' disabled={locked || !printable || !!value.trim()} onClick={() => setShowPrint(true)}><Printer className='mr-2 h-4 w-4' />Preparar etiquetas</Button>}
        {showPrint && printable && selected?._id && !locked && <LabelPrintCenter key={`${selectedId}:${printVersion}`} initialProducts={[product]}
          initialCopies={{ [product._id]: labelCopies }} barcodeIds={{ [product._id]: selected._id }} fixedProducts />}
      </section>
      <DialogFooter><Button variant='outline' disabled={busy} onClick={() => onOpenChange(false)}>Cerrar</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
