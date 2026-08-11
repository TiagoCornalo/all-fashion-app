import { useCallback, useEffect, useMemo, useState } from 'react'
import { AxiosError } from 'axios'
import { Minus, PackageCheck, Plus, ScanBarcode, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea
} from '../../components'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import {
  createInventoryReceipt,
  findProductByBarcode
} from '../../services/barcode.service'
import { Product } from '../../types/inventory.types'

interface ReceiptLine {
  product: Product
  barcodeValue: string
  quantity: number
  unitsPerScan: number
}

interface StockReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted: () => void | Promise<void>
}

const newIdempotencyKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.details || error.response?.data?.error || error.message
  }
  return error instanceof Error ? error.message : 'No se pudo procesar el código'
}

export function StockReceiptDialog({
  open,
  onOpenChange,
  onCompleted
}: StockReceiptDialogProps) {
  const [lines, setLines] = useState<ReceiptLine[]>([])
  const [manualCode, setManualCode] = useState('')
  const [unknownCodes, setUnknownCodes] = useState<string[]>([])
  const [lastProduct, setLastProduct] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(newIdempotencyKey)

  useEffect(() => {
    if (!open) return
    setLines([])
    setUnknownCodes([])
    setManualCode('')
    setLastProduct('')
    setNotes('')
    setIdempotencyKey(newIdempotencyKey())
  }, [open])

  const addScannedCode = useCallback(async (rawValue: string) => {
    const value = rawValue.trim()
    if (!value) return
    setIsLookingUp(true)
    try {
      const result = await findProductByBarcode(value)
      const units = Math.max(1, Number(result.barcode.unitsPerScan || 1))
      setLines((current) => {
        const existing = current.find((line) => line.product._id === result.product._id)
        if (existing) {
          return current.map((line) =>
            line.product._id === result.product._id
              ? {
                  ...line,
                  quantity: line.quantity + units,
                  barcodeValue: result.barcode.value
                }
              : line
          )
        }
        return [
          ...current,
          {
            product: result.product,
            barcodeValue: result.barcode.value,
            quantity: units,
            unitsPerScan: units
          }
        ]
      })
      setUnknownCodes((current) => current.filter((code) => code !== value))
      setLastProduct(`${result.product.code} - ${result.product.name}`)
      setManualCode('')
    } catch (error) {
      setUnknownCodes((current) =>
        current.includes(value) ? current : [...current, value]
      )
      toast.error(getErrorMessage(error))
    } finally {
      setIsLookingUp(false)
    }
  }, [])

  useBarcodeScanner({ enabled: open && !isSubmitting, onScan: addScannedCode })

  const totalUnits = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  )

  const changeQuantity = (productId: string, delta: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.product._id === productId
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0)
    )
  }

  const handleSubmit = async () => {
    if (!lines.length) return
    setIsSubmitting(true)
    try {
      await createInventoryReceipt({
        idempotencyKey,
        notes: notes.trim() || undefined,
        items: lines.map((line) => ({
          productId: line.product._id,
          barcodeValue: line.barcodeValue,
          quantity: line.quantity
        }))
      })
      toast.success(`Ingreso confirmado: ${totalUnits} unidades`)
      await onCompleted()
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[96vw] max-w-3xl gap-3 overflow-hidden p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <PackageCheck className='h-5 w-5' />
            Ingreso de mercadería
          </DialogTitle>
          <DialogDescription>
            El stock cambia recién cuando confirmás el ingreso completo.
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-h-0 flex-col gap-3'>
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
                    void addScannedCode(manualCode)
                  }
                }}
                placeholder='Escanear o escribir código'
                className='pl-9'
              />
            </div>
            <Button
              type='button'
              variant='outline'
              disabled={!manualCode.trim() || isLookingUp}
              onClick={() => void addScannedCode(manualCode)}
            >
              Agregar
            </Button>
          </div>

          <div className='flex min-h-8 flex-wrap items-center gap-2 text-sm'>
            <Badge variant='outline'>Lector listo</Badge>
            <span className='text-muted-foreground'>
              {lastProduct || 'Esperando una lectura'}
            </span>
          </div>

          <div className='max-h-[38vh] overflow-auto rounded-md border'>
            {lines.length === 0 ? (
              <div className='p-8 text-center text-sm text-muted-foreground'>
                Todavía no hay productos en este ingreso.
              </div>
            ) : (
              <div className='divide-y'>
                {lines.map((line) => (
                  <div
                    key={line.product._id}
                    className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center'
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium'>{line.product.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {line.product.code} · Stock actual: {line.product.stock}
                        {line.unitsPerScan > 1 && ` · ${line.unitsPerScan} por lectura`}
                      </p>
                    </div>
                    <div className='flex items-center justify-between gap-2 sm:justify-end'>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => changeQuantity(line.product._id, -1)}
                        title='Restar una unidad'
                      >
                        <Minus className='h-4 w-4' />
                      </Button>
                      <Input
                        type='number'
                        min={1}
                        value={line.quantity}
                        onChange={(event) => {
                          const quantity = Math.max(1, Number(event.target.value) || 1)
                          setLines((current) => current.map((item) =>
                            item.product._id === line.product._id
                              ? { ...item, quantity }
                              : item
                          ))
                        }}
                        className='h-8 w-20 text-center'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => changeQuantity(line.product._id, 1)}
                        title='Sumar una unidad'
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-destructive'
                        onClick={() => setLines((current) =>
                          current.filter((item) => item.product._id !== line.product._id)
                        )}
                        title='Quitar del ingreso'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {unknownCodes.length > 0 && (
            <div className='rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950'>
              <div className='flex items-center justify-between gap-2'>
                <span>Códigos sin producto: {unknownCodes.join(', ')}</span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() => setUnknownCodes((current) => current.slice(0, -1))}
                  title='Quitar el último aviso'
                >
                  <Undo2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}

          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder='Nota del ingreso (opcional)'
            className='min-h-16'
          />
        </div>

        <DialogFooter className='gap-2 sm:items-center sm:justify-between'>
          <div className='text-sm font-medium'>
            {lines.length} productos · {totalUnits} unidades
          </div>
          <div className='flex flex-col-reverse gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={!lines.length || isSubmitting}
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar ingreso'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
