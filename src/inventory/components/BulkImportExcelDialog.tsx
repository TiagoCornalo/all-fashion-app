import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader } from '@/components'
import {
  bulkImportProductsFromExcel,
  BulkImportReport
} from '../../services'

type Props = {
  onCompleted?: () => void
}

const BulkImportExcelDialog = ({ onCompleted }: Props) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<BulkImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [updateStock, setUpdateStock] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const reset = () => {
    setFile(null)
    setReport(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (loading) return
    setOpen(next)
    if (!next) reset()
  }

  const submit = async (dryRun: boolean) => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const result = await bulkImportProductsFromExcel(file, {
        dryRun,
        updateStock
      })
      setReport(result)
      if (!dryRun) onCompleted?.()
    } catch (err: any) {
      setError(
        err?.response?.data?.details ||
          err?.response?.data?.error ||
          err?.message ||
          'Error al importar'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant='outline' className='w-full lg:w-auto'>
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Importar productos desde Excel</DialogTitle>
          <DialogDescription>
            Subí un archivo Excel con las columnas <code>Producto</code>,{' '}
            <code>Codigo</code>, <code>Precio Base</code>,{' '}
            <code>Precio Final</code>, <code>Proveedor</code>, <code>Stock</code>,{' '}
            <code>Moneda</code> y <code>Tipo Dolar</code>. Los proveedores que
            todavía no estén cargados se agregarán automáticamente (después podés
            completar sus datos manualmente).
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <input
            ref={inputRef}
            type='file'
            accept='.xlsx,.xls'
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setReport(null)
              setError(null)
            }}
            disabled={loading}
            className='block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90'
          />

          <label className='flex items-start gap-2 rounded-md border p-3 text-sm'>
            <Checkbox
              checked={updateStock}
              onCheckedChange={(checked) => setUpdateStock(checked === true)}
              disabled={loading}
              className='mt-0.5'
            />
            <span>
              <span className='block font-medium'>Actualizar stock desde el Excel</span>
              <span className='block text-xs text-muted-foreground'>
                Dejalo apagado para corregir proveedores, moneda y precios sin pisar las cantidades actuales del sistema.
              </span>
            </span>
          </label>

          {error && (
            <div className='rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          {report && (
            <div className='space-y-3 rounded-md border p-4'>
              <div className='flex items-center gap-2'>
                <span className='inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs'>
                  {report.dryRun ? 'Vista previa (no se guardó nada)' : 'Importación realizada'}
                </span>
                <span className='text-sm text-muted-foreground'>
                  Hoja usada: {report.sheetUsed}
                </span>
                <span className='text-sm text-muted-foreground'>
                  Stock: {report.updateStock ? 'se actualizará' : 'no se tocará'}
                </span>
              </div>

              <div className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-3'>
                <Stat label='Filas en el archivo' value={report.totalRowsRead} />
                <Stat
                  label='Productos listos para cargar'
                  value={report.productsParsed}
                />
                <Stat
                  label={report.dryRun ? 'Productos nuevos' : 'Productos creados'}
                  value={report.productsCreated}
                />
                <Stat
                  label={
                    report.dryRun
                      ? 'Productos a actualizar'
                      : 'Productos actualizados'
                  }
                  value={report.productsUpdated}
                />
                <Stat
                  label='Con precio en dólares'
                  value={report.productsWithUSD}
                />
                <Stat
                  label='Dólar blue'
                  value={report.productsUSDBlue ?? 0}
                />
                <Stat
                  label='Dólar oficial'
                  value={report.productsUSDOfficial ?? 0}
                />
                <Stat
                  label='Sólo con precio en pesos'
                  value={report.productsARSOnly}
                />
                <Stat
                  label='Proveedores en el archivo'
                  value={report.suppliersInExcel}
                />
                <Stat
                  label='Productos sin proveedor en el archivo'
                  value={report.productsWithoutSupplier ?? 0}
                />
                <Stat
                  label={
                    report.dryRun
                      ? 'Proveedores nuevos a crear'
                      : 'Proveedores nuevos creados'
                  }
                  value={report.suppliersCreated}
                />
                <Stat
                  label='Proveedores ya existentes'
                  value={report.suppliersMatched}
                />
              </div>

              {report.duplicatesInExcel.length > 0 && (
                <details className='text-sm'>
                  <summary className='cursor-pointer font-medium'>
                    Códigos repetidos en el archivo ({report.duplicatesInExcel.length})
                  </summary>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Cuando un código aparece más de una vez en el Excel, se queda con la última fila.
                  </p>
                  <ul className='mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-5 text-xs'>
                    {report.duplicatesInExcel.map((d, i) => (
                      <li key={i}>
                        Código <strong>{d.code}</strong>: se usó la fila {d.kept} y se descartó la {d.discarded}.
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {report.skipped.length > 0 && (
                <details className='text-sm'>
                  <summary className='cursor-pointer font-medium'>
                    Filas que no se importaron ({report.skipped.length})
                  </summary>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Estas filas no se cargaron porque les faltaba algún dato obligatorio (nombre, código o precio).
                  </p>
                  <ul className='mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs'>
                    {report.skipped.map((s, i) => (
                      <li key={i}>
                        Fila {s.row}: {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {report.errors.length > 0 && (
                <details className='text-sm' open>
                  <summary className='cursor-pointer font-medium text-destructive'>
                    Filas con error ({report.errors.length})
                  </summary>
                  <ul className='mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-destructive'>
                    {report.errors.map((e, i) => (
                      <li key={i}>
                        Fila {e.row} (código {e.code}): {e.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter className='flex-col gap-2 sm:flex-row'>
          {loading && <Loader className='mr-2 h-5 w-5' />}
          <Button
            variant='outline'
            disabled={!file || loading}
            onClick={() => submit(true)}
          >
            Probar sin guardar
          </Button>
          <Button
            disabled={!file || loading}
            onClick={() => submit(false)}
          >
            Importar de verdad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className='rounded-md bg-muted p-2'>
    <div className='text-xs text-muted-foreground'>{label}</div>
    <div className='text-lg font-semibold'>{value}</div>
  </div>
)

export default BulkImportExcelDialog
