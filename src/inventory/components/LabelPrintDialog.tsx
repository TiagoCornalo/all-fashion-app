import { useCallback, useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { AxiosError } from 'axios'
import { Info, Printer, ScanBarcode, Tag, Trash2 } from 'lucide-react'
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
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import {
  findProductByBarcode,
  prepareProductLabels
} from '../../services/barcode.service'
import { PreparedProductLabel } from '../../types/barcode.types'
import { Product } from '../../types/inventory.types'

type BarcodePreference = 'PRIMARY_OR_INTERNAL' | 'INTERNAL'

const LABEL_WIDTH_MM = 50
const LABEL_HEIGHT_MM = 30
const SAFE_HORIZONTAL_MARGIN_MM = 3
const MAX_BARCODE_WIDTH_MM = 42.5
const CONTENT_OFFSET_X_MM = 0.5

interface LabelPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
}

const formatArs = (value: number) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  })

const getErrorMessage = (error: unknown) => error instanceof AxiosError
  ? error.response?.data?.details || error.response?.data?.error || error.message
  : error instanceof Error ? error.message : 'No se pudo completar la operación'

const getFinalLabelPrice = (label: PreparedProductLabel) => {
  const explicitFinalPrice = Number(label.finalPriceArs)
  return Number.isFinite(explicitFinalPrice)
    ? explicitFinalPrice
    : Number(label.product.price || 0)
}

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
  const [queuedProducts, setQueuedProducts] = useState<Product[]>([])
  const [labels, setLabels] = useState<PreparedProductLabel[]>([])
  const [copies, setCopies] = useState<Record<string, number>>({})
  const [manualCode, setManualCode] = useState('')
  const [preference, setPreference] = useState<BarcodePreference>('PRIMARY_OR_INTERNAL')
  const [includePrice, setIncludePrice] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)

  useEffect(() => {
    if (!open) return
    const unique = new Map(products.map((product) => [product._id, product]))
    setQueuedProducts([...unique.values()])
    setCopies(Object.fromEntries([...unique.keys()].map((id) => [id, 1])))
    setManualCode('')
  }, [open, products])

  useEffect(() => {
    if (!open) return
    if (queuedProducts.length === 0) {
      setLabels([])
      setIsPreparing(false)
      return
    }

    let active = true
    setIsPreparing(true)
    prepareProductLabels(queuedProducts.map((product) => product._id), preference)
      .then((prepared) => {
        if (!active) return
        setLabels(prepared)
        setCopies((current) => Object.fromEntries(
          prepared.map(({ product }) => [product._id, current[product._id] || 1])
        ))
      })
      .catch((error: unknown) => {
        if (active) toast.error(getErrorMessage(error))
      })
      .finally(() => active && setIsPreparing(false))

    return () => {
      active = false
    }
  }, [open, preference, queuedProducts])

  const addProductByCode = useCallback(async (rawValue: string) => {
    const value = rawValue.trim()
    if (!value) return
    setIsLookingUp(true)
    try {
      const result = await findProductByBarcode(value)
      setQueuedProducts((current) => current.some((item) => item._id === result.product._id)
        ? current
        : [...current, result.product])
      setCopies((current) => ({
        ...current,
        [result.product._id]: current[result.product._id] || 1
      }))
      setManualCode('')
      toast.success(`${result.product.code} agregado a la cola`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  useBarcodeScanner({ enabled: open && !isLookingUp, onScan: addProductByCode })

  const totalLabels = labels.reduce(
    (sum, { product }) => sum + Math.max(1, copies[product._id] || 1),
    0
  )

  const removeProduct = (productId: string) => {
    setQueuedProducts((current) => current.filter((product) => product._id !== productId))
  }

  const handlePrint = () => {
    if (!labels.length) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('El navegador bloqueó la ventana de impresión')
      return
    }

    try {
      const printLabels = labels.flatMap((label) => {
        const { product, barcode } = label
        const amount = Math.max(1, copies[product._id] || 1)
        const finalPriceArs = getFinalLabelPrice(label)
        return Array.from({ length: amount }, () => ({
          product,
          barcode,
          finalPriceArs
        }))
      })

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
        compress: true,
        precision: 16
      })
      pdf.setProperties({ title: 'Etiquetas 50x30 mm' })

      printLabels.forEach(({ product, barcode, finalPriceArs }, index) => {
        if (index > 0) {
          pdf.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], 'landscape')
        }

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const centerX = pageWidth / 2 + CONTENT_OFFSET_X_MM
        const contentWidth = pageWidth - SAFE_HORIZONTAL_MARGIN_MM * 2

        pdf.setTextColor(0, 0, 0)
        pdf.setFont('helvetica', 'bold')
        let productNameFontSize = 7.5
        pdf.setFontSize(productNameFontSize)
        let productNameLines = pdf.splitTextToSize(product.name, contentWidth)
        while (productNameLines.length > 2 && productNameFontSize > 5.5) {
          productNameFontSize -= 0.5
          pdf.setFontSize(productNameFontSize)
          productNameLines = pdf.splitTextToSize(product.name, contentWidth)
        }
        pdf.text(productNameLines, centerX, 2.8, {
          align: 'center',
          lineHeightFactor: 1.05,
          maxWidth: contentWidth
        })

        const nameLineHeight = productNameFontSize * 0.3528 * 1.05
        const codeY = 2.8 + (productNameLines.length - 1) * nameLineHeight + 2.6
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(5.5)
        pdf.text(`Código ${product.code}`, centerX, codeY, { align: 'center' })

        const barcodeCanvas = document.createElement('canvas')
        JsBarcode(barcodeCanvas, barcode.value, {
          format: 'CODE128',
          displayValue: true,
          width: 2,
          height: 48,
          margin: 12,
          fontSize: 12,
          background: '#ffffff',
          lineColor: '#000000'
        })

        const barcodeTop = codeY + 1
        const barcodeBottom = includePrice ? pageHeight - 5.8 : pageHeight - 2.5
        const maxBarcodeWidth = Math.min(contentWidth, MAX_BARCODE_WIDTH_MM)
        const maxBarcodeHeight = barcodeBottom - barcodeTop
        const barcodeRatio = barcodeCanvas.width / barcodeCanvas.height
        let barcodeWidth = maxBarcodeWidth
        let barcodeHeight = barcodeWidth / barcodeRatio
        if (barcodeHeight > maxBarcodeHeight) {
          barcodeHeight = maxBarcodeHeight
          barcodeWidth = barcodeHeight * barcodeRatio
        }
        pdf.addImage(
          barcodeCanvas.toDataURL('image/png'),
          'PNG',
          centerX - barcodeWidth / 2,
          barcodeTop,
          barcodeWidth,
          barcodeHeight,
          undefined,
          'FAST'
        )

        if (includePrice) {
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8)
          pdf.text(formatArs(finalPriceArs), centerX, pageHeight - 2.2, {
            align: 'center'
          })
        }
      })

      pdf.autoPrint()
      const pdfUrl = URL.createObjectURL(pdf.output('blob'))
      printWindow.location.replace(pdfUrl)
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 120000)
    } catch (error) {
      printWindow.close()
      toast.error(getErrorMessage(error))
    }
  }

  const preview = labels[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-3xl gap-3 p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'><Printer className='h-5 w-5' />Centro de etiquetas</DialogTitle>
          <DialogDescription>Escaneá productos para armar la cola y después imprimí el lote completo.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-2 sm:flex-row'>
          <div className='relative flex-1'>
            <ScanBarcode className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              autoFocus
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void addProductByCode(manualCode)
                }
              }}
              placeholder='Escanear o ingresar un código exacto'
              className='pl-9'
            />
          </div>
          <Button type='button' variant='outline' disabled={!manualCode.trim() || isLookingUp} onClick={() => void addProductByCode(manualCode)}>Agregar</Button>
        </div>

        <div className='grid gap-4 md:grid-cols-[1fr_220px]'>
          <div className='space-y-3'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Tamaño y orientación</Label>
                <div className='flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium'>
                  50 mm ancho × 30 mm alto · Horizontal
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Código a imprimir</Label>
                <Select value={preference} onValueChange={(value) => setPreference(value as BarcodePreference)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='PRIMARY_OR_INTERNAL'>Principal o interno</SelectItem>
                    <SelectItem value='INTERNAL'>Siempre código interno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className='flex items-center gap-2 text-sm'>
              <Checkbox checked={includePrice} onCheckedChange={(checked) => setIncludePrice(checked === true)} />
              Incluir precio final de venta
            </label>

            <div className='max-h-56 divide-y overflow-auto rounded-md border'>
              {isPreparing ? (
                <div className='p-6 text-center text-sm text-muted-foreground'>Preparando códigos...</div>
              ) : labels.length === 0 ? (
                <div className='p-6 text-center text-sm text-muted-foreground'>Escaneá un producto o abrí este centro con productos seleccionados.</div>
              ) : labels.map(({ product, barcode }) => (
                <div key={product._id} className='flex items-center gap-3 p-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium'>{product.name}</p>
                    <p className='truncate text-xs text-muted-foreground'>{product.code} · {barcode.value} · {barcode.origin === 'INTERNAL' ? 'interno' : 'existente'}</p>
                  </div>
                  <Input
                    type='number'
                    min={1}
                    max={999}
                    value={copies[product._id] || 1}
                    onChange={(event) => setCopies((current) => ({ ...current, [product._id]: Math.min(999, Math.max(1, Number(event.target.value) || 1)) }))}
                    className='h-8 w-20 text-center'
                    aria-label={`Copias de ${product.name}`}
                  />
                  <Button type='button' variant='ghost' size='icon' onClick={() => removeProduct(product._id)} title='Quitar de la cola'><Trash2 className='h-4 w-4' /></Button>
                </div>
              ))}
            </div>

            <div className='flex gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground'>
              <Info className='mt-0.5 h-4 w-4 shrink-0' />
              <span>Se genera un PDF de 50 × 30 mm aprovechando el ancho imprimible y conservando una zona segura para que las barras no se corten.</span>
            </div>
          </div>

          <div className='flex items-center justify-center bg-muted/30 p-3'>
            <div className='flex w-[200px] max-w-full flex-col items-center justify-center overflow-hidden border bg-white px-4 py-2 text-black shadow-sm' style={{ aspectRatio: `${LABEL_WIDTH_MM} / ${LABEL_HEIGHT_MM}` }}>
              {preview ? (
                <>
                  <p className='line-clamp-2 text-center text-xs font-bold leading-tight'>{preview.product.name}</p>
                  <p className='text-[9px]'>Código {preview.product.code}</p>
                  <BarcodePreview value={preview.barcode.value} />
                  {includePrice && (
                    <p className='text-xs font-bold'>
                      {formatArs(getFinalLabelPrice(preview))}
                    </p>
                  )}
                </>
              ) : <Tag className='h-8 w-8 text-muted-foreground' />}
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:items-center sm:justify-between'>
          <span className='text-sm text-muted-foreground'>{totalLabels} etiquetas</span>
          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>Cerrar</Button>
            <Button onClick={handlePrint} disabled={!labels.length || isPreparing}><Printer className='mr-2 h-4 w-4' />Imprimir lote</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
