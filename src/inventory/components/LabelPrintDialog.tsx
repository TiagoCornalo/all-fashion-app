import { useEffect, useMemo, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import { AxiosError } from 'axios'
import { Info, Printer, Tag } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components'
import { prepareProductLabels } from '../../services/barcode.service'
import { PreparedProductLabel } from '../../types/barcode.types'
import { Product } from '../../types/inventory.types'

interface LabelSize {
  id: string
  name: string
  width: number
  height: number
}

const LABEL_SIZES: LabelSize[] = [
  { id: '40x25', name: 'Compacta 40 x 25 mm', width: 40, height: 25 },
  { id: '50x30', name: 'Normal 50 x 30 mm', width: 50, height: 30 },
  { id: '60x40', name: 'Grande 60 x 40 mm', width: 60, height: 40 },
  { id: '100x50', name: 'Ancha 100 x 50 mm', width: 100, height: 50 }
]

interface LabelPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;'
  })[character] || character)

const formatArs = (value: number) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  })

function BarcodePreview({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!ref.current || !value) return
    JsBarcode(ref.current, value, {
      format: 'CODE128',
      displayValue: true,
      width: 1.4,
      height: 34,
      margin: 0,
      fontSize: 10
    })
  }, [value])

  return <svg ref={ref} className='max-h-14 w-full' />
}

export function LabelPrintDialog({
  open,
  onOpenChange,
  products
}: LabelPrintDialogProps) {
  const [labels, setLabels] = useState<PreparedProductLabel[]>([])
  const [copies, setCopies] = useState<Record<string, number>>({})
  const [sizeId, setSizeId] = useState('50x30')
  const [includePrice, setIncludePrice] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (!open || products.length === 0) return
    let active = true
    setIsPreparing(true)
    setLabels([])
    prepareProductLabels(products.map((product) => product._id))
      .then((prepared) => {
        if (!active) return
        setLabels(prepared)
        setCopies(Object.fromEntries(prepared.map(({ product }) => [product._id, 1])))
      })
      .catch((error: unknown) => {
        const message = error instanceof AxiosError
          ? error.response?.data?.details || error.response?.data?.error
          : 'No se pudieron preparar las etiquetas'
        toast.error(message)
      })
      .finally(() => active && setIsPreparing(false))
    return () => {
      active = false
    }
  }, [open, products])

  const selectedSize = useMemo(
    () => LABEL_SIZES.find((size) => size.id === sizeId) || LABEL_SIZES[1],
    [sizeId]
  )

  const totalLabels = labels.reduce(
    (sum, { product }) => sum + Math.max(1, copies[product._id] || 1),
    0
  )

  const handlePrint = () => {
    if (!labels.length) return
    const printWindow = window.open('', '_blank', 'width=700,height=700')
    if (!printWindow) {
      toast.error('El navegador bloqueó la ventana de impresión')
      return
    }

    const renderedLabels = labels.flatMap(({ product, barcode }) => {
      const amount = Math.max(1, copies[product._id] || 1)
      return Array.from({ length: amount }, () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        JsBarcode(svg, barcode.value, {
          format: 'CODE128',
          displayValue: true,
          width: selectedSize.width <= 40 ? 1.15 : 1.5,
          height: selectedSize.height <= 25 ? 30 : 40,
          margin: 0,
          fontSize: selectedSize.width <= 40 ? 8 : 10
        })
        return `
          <section class="label">
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-code">Código ${escapeHtml(product.code)}</div>
            <div class="barcode">${svg.outerHTML}</div>
            ${includePrice ? `<div class="price">${escapeHtml(formatArs(product.price))}</div>` : ''}
          </section>`
      })
    }).join('')

    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>Etiquetas de productos</title>
      <style>
        @page { size: ${selectedSize.width}mm ${selectedSize.height}mm; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
        .label {
          width: ${selectedSize.width}mm;
          height: ${selectedSize.height}mm;
          padding: 1.5mm 2mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          break-after: page;
          page-break-after: always;
        }
        .label:last-child { break-after: auto; page-break-after: auto; }
        .product-name {
          width: 100%;
          text-align: center;
          font-size: ${selectedSize.width <= 40 ? 8 : 10}pt;
          font-weight: 700;
          line-height: 1.05;
          max-height: 2.1em;
          overflow: hidden;
        }
        .product-code { font-size: 7pt; margin-top: .5mm; }
        .barcode { width: 100%; display: flex; justify-content: center; overflow: hidden; }
        .barcode svg { max-width: 100%; height: ${includePrice ? '11mm' : '13mm'}; }
        .price { font-size: 10pt; font-weight: 700; line-height: 1; }
      </style></head><body>${renderedLabels}
      <script>window.addEventListener('load', () => { window.print(); });</script>
      </body></html>`)
    printWindow.document.close()
  }

  const preview = labels[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-2xl gap-3 p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Printer className='h-5 w-5' />
            Imprimir etiquetas
          </DialogTitle>
          <DialogDescription>
            Preparadas para impresora térmica, sin escala ni márgenes.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 md:grid-cols-[1fr_220px]'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>Tamaño</Label>
              <Select value={sizeId} onValueChange={setSizeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LABEL_SIZES.map((size) => (
                    <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                checked={includePrice}
                onCheckedChange={(checked) => setIncludePrice(checked === true)}
              />
              Incluir precio actual
            </label>

            <div className='max-h-52 divide-y overflow-auto rounded-md border'>
              {isPreparing ? (
                <div className='p-6 text-center text-sm text-muted-foreground'>
                  Preparando códigos...
                </div>
              ) : labels.map(({ product }) => (
                <div key={product._id} className='flex items-center gap-3 p-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{product.name}</p>
                    <p className='text-xs text-muted-foreground'>{product.code}</p>
                  </div>
                  <Input
                    type='number'
                    min={1}
                    max={999}
                    value={copies[product._id] || 1}
                    onChange={(event) => setCopies((current) => ({
                      ...current,
                      [product._id]: Math.min(999, Math.max(1, Number(event.target.value) || 1))
                    }))}
                    className='h-8 w-20 text-center'
                    aria-label={`Copias de ${product.name}`}
                  />
                </div>
              ))}
            </div>

            <div className='flex gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground'>
              <Info className='mt-0.5 h-4 w-4 shrink-0' />
              <span>
                Rollo recomendado: térmico directo de 50 x 30 mm, con separación de 2 a 3 mm y núcleo de 25,4 mm. En la impresión elegí escala 100% y márgenes Ninguno.
              </span>
            </div>
          </div>

          <div className='flex items-center justify-center bg-muted/30 p-3'>
            <div
              className='flex max-w-full flex-col items-center justify-center overflow-hidden border bg-white p-2 text-black shadow-sm'
              style={{
                width: `${Math.min(selectedSize.width * 3.5, 210)}px`,
                aspectRatio: `${selectedSize.width} / ${selectedSize.height}`
              }}
            >
              {preview ? (
                <>
                  <p className='line-clamp-2 text-center text-xs font-bold leading-tight'>
                    {preview.product.name}
                  </p>
                  <p className='text-[9px]'>Código {preview.product.code}</p>
                  <BarcodePreview value={preview.barcode.value} />
                  {includePrice && (
                    <p className='text-xs font-bold'>{formatArs(preview.product.price)}</p>
                  )}
                </>
              ) : (
                <Tag className='h-8 w-8 text-muted-foreground' />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:items-center sm:justify-between'>
          <span className='text-sm text-muted-foreground'>{totalLabels} etiquetas</span>
          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handlePrint} disabled={!labels.length || isPreparing}>
              <Printer className='mr-2 h-4 w-4' />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
