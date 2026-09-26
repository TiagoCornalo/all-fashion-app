import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { getPrinter, listPrinters, PRINTERS_CHANGED, savePrinter } from '../../services/printerService'

// Mounted only within the administrator's printing settings, never at checkout.
export default function PrinterSettings() {
  const [printers, setPrinters] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(getPrinter)
  useEffect(() => {
    const refresh = () => setSelected(getPrinter())
    window.addEventListener(PRINTERS_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => { window.removeEventListener(PRINTERS_CHANGED, refresh); window.removeEventListener('storage', refresh) }
  }, [])
  return <section aria-label='Configuración de tickets' className='space-y-3 rounded-lg border p-4'>
    <h2 className='font-medium'>Impresión de tickets</h2>
    <p className='text-sm text-muted-foreground'>Elegí una vez dónde imprimir los tickets desde esta computadora. Las etiquetas seguirán usando la ventana de impresión habitual.</p>
    <Button variant='outline' disabled={busy} onClick={async () => {
      setBusy(true); setError('')
      try { setPrinters(await listPrinters()); setLoaded(true) }
      catch { setError('No se pudo conectar con el servicio de impresión. Revisá su instalación en esta computadora.') }
      finally { setBusy(false) }
    }}>{busy ? 'Buscando…' : 'Buscar impresoras'}</Button>
    <label className='block space-y-1 text-sm'><span>Destino de los tickets</span>
      <select aria-label='Destino de los tickets' className='w-full rounded border p-2' value={selected} disabled={!loaded || busy} onChange={event => {
        try { savePrinter(event.target.value); setError('') } catch { setError('No se pudo guardar la selección en este navegador.') }
      }}>
        <option value=''>Sin configurar</option>
        {selected && !printers.includes(selected) && <option value={selected}>{selected}{loaded ? ' (no disponible)' : ' (guardada)'}</option>}
        {printers.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
    </label>
    {loaded && !printers.length && <p role='status' className='text-sm'>No se encontraron impresoras disponibles.</p>}
    {error && <p role='alert' className='text-sm text-red-700'>{error}</p>}
  </section>
}
