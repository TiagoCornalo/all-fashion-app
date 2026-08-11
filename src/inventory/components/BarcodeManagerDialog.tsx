import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Barcode, Plus, ScanBarcode, Trash2, WandSparkles } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label
} from '../../components'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import {
  addProductBarcode,
  deactivateProductBarcode,
  generateInternalProductBarcode,
  getProductBarcodes
} from '../../services/barcode.service'
import { ProductBarcode } from '../../types/barcode.types'
import { Product } from '../../types/inventory.types'

interface BarcodeManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onUpdated: () => void | Promise<void>
}

const errorMessage = (error: unknown) => error instanceof AxiosError
  ? error.response?.data?.details || error.response?.data?.error || error.message
  : error instanceof Error ? error.message : 'No se pudo completar la operación'

export function BarcodeManagerDialog({
  open,
  onOpenChange,
  product,
  onUpdated
}: BarcodeManagerDialogProps) {
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
  const [value, setValue] = useState('')
  const [unitsPerScan, setUnitsPerScan] = useState(1)
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadBarcodes = useCallback(async () => {
    if (!product) return
    setLoading(true)
    try {
      setBarcodes(await getProductBarcodes(product._id))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [product])

  useEffect(() => {
    if (!open) return
    setValue('')
    setUnitsPerScan(1)
    setIsPrimary(false)
    void loadBarcodes()
  }, [loadBarcodes, open])

  useBarcodeScanner({
    enabled: open && !loading,
    onScan: (scannedValue) => {
      setValue(scannedValue)
      toast.success('Código capturado')
    }
  })

  const handleAdd = async () => {
    if (!product || !value.trim()) return
    setLoading(true)
    try {
      await addProductBarcode(product._id, {
        value: value.trim(),
        origin: 'MANUFACTURER',
        isPrimary,
        unitsPerScan
      })
      setValue('')
      setUnitsPerScan(1)
      setIsPrimary(false)
      await loadBarcodes()
      await onUpdated()
      toast.success('Código agregado')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!product) return
    setLoading(true)
    try {
      await generateInternalProductBarcode(product._id)
      await loadBarcodes()
      await onUpdated()
      toast.success('Código interno preparado')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (barcode: ProductBarcode) => {
    if (!product || !barcode._id) return
    setLoading(true)
    try {
      await deactivateProductBarcode(product._id, barcode._id)
      await loadBarcodes()
      await onUpdated()
      toast.success('Código desactivado')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-xl gap-3 p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Barcode className='h-5 w-5' />
            Códigos del producto
          </DialogTitle>
          <DialogDescription>
            {product ? `${product.code} - ${product.name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='grid gap-3 sm:grid-cols-[1fr_110px]'>
            <div className='space-y-1.5'>
              <Label htmlFor='new-barcode'>Código</Label>
              <div className='relative'>
                <Input
                  id='new-barcode'
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void handleAdd()
                    }
                  }}
                  placeholder='Escanear o escribir'
                  className='pr-9'
                />
                <ScanBarcode className='absolute right-3 top-2.5 h-4 w-4 text-muted-foreground' />
              </div>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='units-per-scan'>Unidades</Label>
              <Input
                id='units-per-scan'
                type='number'
                min={1}
                value={unitsPerScan}
                onChange={(event) => setUnitsPerScan(Math.max(1, Number(event.target.value) || 1))}
              />
            </div>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked === true)}
              />
              Usar como código principal
            </label>
            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={() => void handleGenerate()} disabled={loading}>
                <WandSparkles className='mr-2 h-4 w-4' />
                Generar interno
              </Button>
              <Button type='button' onClick={() => void handleAdd()} disabled={!value.trim() || loading}>
                <Plus className='mr-2 h-4 w-4' />
                Agregar
              </Button>
            </div>
          </div>

          <div className='max-h-64 divide-y overflow-auto rounded-md border'>
            {barcodes.length === 0 ? (
              <div className='p-6 text-center text-sm text-muted-foreground'>
                Este producto todavía no tiene códigos asociados.
              </div>
            ) : barcodes.map((barcode) => (
              <div key={barcode._id || barcode.value} className='flex items-center gap-2 p-3'>
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-mono text-sm'>{barcode.value}</p>
                  <div className='mt-1 flex flex-wrap gap-1'>
                    <Badge variant='outline'>{barcode.format}</Badge>
                    <Badge variant='secondary'>
                      {barcode.origin === 'INTERNAL' ? 'Interno' : barcode.origin === 'LEGACY' ? 'Anterior' : 'Fabricante'}
                    </Badge>
                    {barcode.isPrimary && <Badge>Principal</Badge>}
                    {barcode.unitsPerScan > 1 && (
                      <Badge variant='warning'>{barcode.unitsPerScan} unidades</Badge>
                    )}
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-destructive'
                  disabled={loading}
                  onClick={() => void handleDelete(barcode)}
                  title='Desactivar código'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
