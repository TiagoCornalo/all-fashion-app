import { useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components'
import { Supplier } from '../../types/inventory.types'
import { previewSupplierPrices, updateSupplierPrices, SupplierPricePreview, SupplierPriceAdjustment } from '../../services/suppliers'

const formatCost = (value: number, currency: 'ARS' | 'USD') =>
  `${currency} ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function SupplierPricesDialog({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [operation, setOperation] = useState<SupplierPriceAdjustment['operation']>('increase')
  const [percentage, setPercentage] = useState('')
  const [preview, setPreview] = useState<SupplierPricePreview | null>(null)
  const [skipInvalidCosts, setSkipInvalidCosts] = useState(false)
  const [useSalePriceForMissingCosts, setUseSalePriceForMissingCosts] = useState(false)
  const [updateSalePrices, setUpdateSalePrices] = useState(false)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState('')
  const value = Number(percentage.replace(',', '.'))
  const valid = Number.isFinite(value) && value > 0 && value <= 10000 && (operation !== 'decrease' || value < 100)
  const percentageError = !percentage.trim() ? ''
    : !Number.isFinite(value) || value <= 0 ? 'Ingresá un porcentaje mayor a cero.'
    : operation === 'decrease' && value >= 100 ? 'La disminución debe ser menor al 100% para que el costo no quede en cero ni sea negativo.'
    : value > 10000 ? 'El porcentaje ingresado es demasiado alto. El máximo permitido es 10.000%.' : ''
  const verb = operation === 'increase' ? 'incremento' : 'disminución'
  const adjustment = operation === 'increase' ? 'el incremento' : 'la disminución'

  const submit = async () => {
    if (pending.current || !valid || !supplier._id) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const input = { operation, percentage: value, useSalePriceForMissingCosts, updateSalePrices }
      if (!preview) {
        setSkipInvalidCosts(false)
        setPreview(await previewSupplierPrices(supplier._id, input))
      } else {
        if (preview.excluded.length > 0 && !skipInvalidCosts) return
        const result = await updateSupplierPrices(supplier._id, { ...input, revision: preview.revision, skipInvalidCosts })
        toast.success(`Se actualizaron los costos base${updateSalePrices ? ' y los precios de venta' : ''} de ${result.count} productos de ${supplier.name} (${verb} del ${value}%).`)
        void queryClient.invalidateQueries()
        onClose()
      }
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.error || 'No se pudo completar la operación. Revisá los precios antes de reintentar.' : 'No se pudo completar la operación.')
      setPreview(null)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending.current) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modificar costos base de {supplier.name}</DialogTitle>
          <DialogDescription>Aplicá un porcentaje sobre el costo base actual de todos los productos del proveedor, incluidos los que no tienen stock.</DialogDescription>
        </DialogHeader>
        <p className='text-sm text-muted-foreground'>Cada costo conserva su moneda (ARS o USD) y se redondea a dos decimales. Podés elegir si también querés ajustar la venta.</p>
        <div className='space-y-2'>
          <Label htmlFor='price-operation'>Tipo de ajuste</Label>
          <select id='price-operation' className='flex h-10 w-full rounded-md border bg-background px-3 text-sm' value={operation} disabled={busy || !!preview}
            onChange={(event) => setOperation(event.target.value as SupplierPriceAdjustment['operation'])}>
            <option value='increase'>Incrementar</option>
            <option value='decrease'>Disminuir</option>
          </select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='price-percentage'>Porcentaje (%)</Label>
          <Input id='price-percentage' inputMode='decimal' value={percentage} placeholder='15' disabled={busy || !!preview}
            onChange={(event) => setPercentage(event.target.value)} aria-invalid={!!percentageError} aria-describedby={percentageError ? 'price-percentage-help price-percentage-error' : 'price-percentage-help'} />
          <p id='price-percentage-help' className='text-sm text-muted-foreground'>Ingresá el porcentaje sin el símbolo %. Por ejemplo, 15 para {operation === 'increase' ? 'aumentar' : 'disminuir'} un 15%.</p>
          {percentageError && <p id='price-percentage-error' role='alert' className='text-sm text-red-600'>{percentageError}</p>}
        </div>
        <div className='space-y-2 rounded-md border p-3 text-sm'>
          <label className='flex items-start gap-2'>
            <input type='checkbox' className='mt-1' checked={useSalePriceForMissingCosts} disabled={busy}
              onChange={(event) => { setUseSalePriceForMissingCosts(event.target.checked); setPreview(null); setSkipInvalidCosts(false); setError('') }} />
            Usar el precio de venta para los productos sin costo base válido.
          </label>
          <p className='text-muted-foreground'>Se aplicará el porcentaje al precio de venta actual y el resultado se guardará como costo base, en la moneda de venta (USD si tiene precio en dólares; ARS en los demás).</p>
        </div>
        <div className='space-y-2 rounded-md border p-3 text-sm'>
          <label className='flex items-start gap-2'>
            <input type='checkbox' className='mt-1' checked={updateSalePrices} disabled={busy}
              onChange={(event) => { setUpdateSalePrices(event.target.checked); setPreview(null); setSkipInvalidCosts(false); setError('') }} />
            Aplicar también el porcentaje al precio de venta.
          </label>
          <p className='text-muted-foreground'>Cada precio de venta se ajusta desde su valor actual. En ventas en dólares se ajusta el importe USD y se mantiene la conversión a pesos. Si desmarcás esta opción, la venta no cambia. Los productos excluidos quedan sin cambios.</p>
          {updateSalePrices && useSalePriceForMissingCosts && <p>En productos sin costo base, el costo nuevo y la venta nueva partirán del mismo precio de venta actual. El porcentaje se aplica una sola vez a cada valor.</p>}
        </div>
        {preview && <div className='space-y-3'>
          <p className='font-medium'>Productos a actualizar: {preview.count} de {preview.total}</p>
          {preview.replacements.length > 0 && <div className='space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm'>
            <p>{preview.replacements.length} productos usarán el precio de venta como referencia para crear su costo base:</p>
            <ul className='max-h-40 overflow-y-auto space-y-1'>
              {preview.replacements.map((product) => <li key={product.code}>{product.code} — {product.name}: venta {formatCost(product.oldPrice, product.currency)} → costo base {formatCost(product.newPrice, product.currency)}</li>)}
            </ul>
          </div>}
          {preview.excluded.length > 0 && <div className='space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm'>
            <p>{preview.excluded.length} productos tienen datos faltantes o inválidos y quedarán sin cambios.</p>
            <ul className='max-h-40 overflow-y-auto space-y-1'>
              {preview.excluded.map((product) => <li key={product._id}>{product.code} — {product.name}: {product.reason}</li>)}
            </ul>
            {preview.count > 0 && <label className='flex items-start gap-2'>
              <input type='checkbox' className='mt-1' checked={skipInvalidCosts} disabled={busy} onChange={(event) => setSkipInvalidCosts(event.target.checked)} />
              Continuar solo con los {preview.count} productos incluidos en la vista previa.
            </label>}
          </div>}
          {preview.count === 0 ? <p>{preview.total > 0 ? 'Completá los costos base de estos productos antes de aplicar un porcentaje.' : 'Este proveedor no tiene productos para actualizar.'}</p> : <>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <caption className='text-left text-muted-foreground'>Vista previa (hasta 5 productos)</caption>
                <thead><tr><th className='py-2 text-left'>Producto</th><th className='text-right'>Antes</th><th className='text-right'>Después</th></tr></thead>
                <tbody>{preview.examples.map((product) => <tr key={product.code} className='border-t'>
                  <td className='py-2 pr-2'>{product.name}{product.sale && <span className='block text-xs text-muted-foreground'>Costo / venta</span>}{product.sale?.conversion && <span className='block text-xs text-muted-foreground'>{product.sale.conversion.enabled ? `Dólar ${product.sale.conversion.rateType}: ${formatCost(product.sale.conversion.rateValue, 'ARS')} + ${formatCost(product.sale.conversion.surchargeArs, 'ARS')}` : 'Conversión automática desactivada: ajuste sobre pesos actuales'}</span>}</td>
                  <td className='text-right whitespace-nowrap'>{formatCost(product.oldPrice, product.currency)}{product.sale && <span className='block mt-1'>{formatCost(product.sale.oldPrice, product.sale.currency)}</span>}{product.sale?.conversion && <span className='block text-xs text-muted-foreground'>{formatCost(product.sale.conversion.oldArs, 'ARS')}</span>}</td>
                  <td className='pl-2 text-right whitespace-nowrap'>{formatCost(product.newPrice, product.currency)}{product.sale && <span className='block mt-1'>{formatCost(product.sale.newPrice, product.sale.currency)}</span>}{product.sale?.conversion && <span className='block text-xs text-muted-foreground'>{formatCost(product.sale.conversion.newArs, 'ARS')}</span>}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p>¿Confirmás {adjustment} del {value}% sobre el costo base{updateSalePrices ? ' y el precio de venta' : ''} de los {preview.count} productos de {preview.supplier.name}?</p>
          </>}
        </div>}
        {error && <p role='alert' className='text-sm text-red-600'>{error}</p>}
        <DialogFooter className='gap-2'>
          <Button variant='outline' disabled={busy} onClick={onClose}>Cancelar</Button>
          {preview && <Button variant='outline' disabled={busy} onClick={() => setPreview(null)}>Volver</Button>}
          <Button disabled={busy || !valid || preview?.count === 0 || (!!preview?.excluded.length && !skipInvalidCosts)} onClick={submit}>
            {busy ? 'Procesando…' : preview ? 'Confirmar actualización' : 'Ver vista previa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
