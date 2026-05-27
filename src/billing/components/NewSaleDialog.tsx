import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import { useSaleStore } from '../../stores/saleStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button
} from '../../components'
import { toast } from 'react-toastify'
import {
  ProductSelector,
  PaymentForm,
  InvoiceForm,
  SaleSummary,
  ComboSelector,
  PromotionApplier,
  TransferConfirmationModal
} from './sale'
import { useSaleForm } from './hooks/useSaleForm'
import { useSaleTotals } from './hooks/useSaleTotals'
import { useIsMobile } from '../../hooks'

interface NewSaleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const NewSaleDialog = ({ isOpen, onOpenChange }: NewSaleDialogProps) => {
  const isMobile = useIsMobile()
  const { currentRegister, fetchCurrentRegister } = useCashRegisterStore()
  const { createSale } = useSaleStore()
  const {
    step,
    setStep,
    items,
    isSubmitting,
    setIsSubmitting,
    handleNext,
    handleBack,
    handleCancel,
    isStepAccessible,
    showTransferConfirmation,
    setShowTransferConfirmation,
    handleTransferConfirmation,
    selectedMethods,
    paymentAmounts,
    handlePromotionRegistration
  } = useSaleForm()

  // Obtener combos del store
  const { combos, getTransferData, setPayments } = useSaleStore()
  const { paymentsForBackend } = useSaleTotals()

  // Verificar si hay elementos para la venta (productos o combos)
  const hasSaleItems = items.length > 0 || combos.length > 0

  const steps = [
    { id: 1, title: 'Productos' },
    { id: 2, title: 'Pago' },
    { id: 3, title: 'Facturación' },
    { id: 4, title: 'Resumen' }
  ]

  const handleSubmit = async () => {
    if (!currentRegister) {
      toast.error('No hay caja abierta. Abrí la caja antes de cobrar.')
      return
    }

    try {
      setIsSubmitting(true)

      // Sincronizar payments del hook (con bank + surcharge calculados en vivo)
      // antes de crear la venta. Esto es la fuente única de verdad.
      setPayments(paymentsForBackend)

      const saleResult = await createSale(currentRegister._id)

      if (saleResult?.sale?._id) {
        await handlePromotionRegistration(saleResult.sale._id)
      }

      toast.success('Venta realizada correctamente')
      await fetchCurrentRegister()
      if (handleCancel()) {
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error(error)
      const label = error?.label || 'Error al realizar la venta'
      const message = error?.message || 'Error desconocido'
      toast.error(`${label}: ${message}`, { autoClose: 8000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className='space-y-4'>
            <ProductSelector />
            <ComboSelector />
            <PromotionApplier />
          </div>
        )
      case 2:
        return <PaymentForm />
      case 3:
        return <InvoiceForm />
      case 4:
        return (
          <div className='space-y-4'>
            <SaleSummary />
            <div className='flex flex-col sm:flex-row justify-end gap-2 mt-4'>
              <Button
                variant='outline'
                onClick={() => handleCancel() && onOpenChange(false)}
                className='w-full sm:w-auto order-2 sm:order-1'
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className='w-full sm:w-auto order-1 sm:order-2'
              >
                {isSubmitting ? 'Procesando...' : 'Finalizar Venta'}
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className='w-[95vw] max-w-4xl max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl'>
              {isMobile ? `${steps[step - 1].title} (${step}/4)` : 'Nueva Venta'}
            </DialogTitle>
          </DialogHeader>

          <div className='flex-1 flex flex-col min-h-0'>
            {/* Stepper - solo visible en desktop */}
            {!isMobile && (
              <div className='flex justify-between items-center sticky top-0 bg-background z-10 py-2 w-full px-1 border-b mb-4'>
                {steps.map((s) => (
                  <div
                    key={s.id}
                    className={`flex items-center flex-1 cursor-pointer ${step >= s.id ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    onClick={() => {
                      if (s.id < step || isStepAccessible(s.id)) {
                        setStep(s.id)
                      }
                    }}
                  >
                    <div
                      className={`
                      min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center border text-sm
                      ${step >= s.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-muted-foreground'
                        }
                    `}
                    >
                      {s.id}
                    </div>
                    <span className='ml-2 text-sm'>{s.title}</span>
                    {s.id < steps.length && (
                      <div
                        className={`h-[2px] mx-4 flex-grow ${step > s.id ? 'bg-primary' : 'bg-muted-foreground'
                          }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className='flex-1 overflow-y-auto pb-4'>
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          {step < 4 && (
            <div className='flex flex-col sm:flex-row justify-between gap-2 mt-4 pt-4 border-t bg-background'>
              <Button
                variant='outline'
                onClick={handleBack}
                disabled={step === 1}
                className='w-full sm:w-auto order-2 sm:order-1'
              >
                Atrás
              </Button>
              <Button
                onClick={handleNext}
                disabled={step === 1 && !hasSaleItems}
                className='w-full sm:w-auto order-1 sm:order-2'
              >
                Siguiente
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para transferencias - fuera del dialog principal */}
      {selectedMethods.includes('TRANSFER') && (
        <TransferConfirmationModal
          isOpen={showTransferConfirmation}
          onOpenChange={setShowTransferConfirmation}
          onConfirm={handleTransferConfirmation}
          customerPhone={getTransferData('TRANSFER').customerPhone || ''}
          amount={paymentAmounts['TRANSFER'] || 0}
        />
      )}
    </>
  )
}

export default NewSaleDialog
