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
  const { combos, getTransferData } = useSaleStore()

  // Verificar si hay elementos para la venta (productos o combos)
  const hasSaleItems = items.length > 0 || combos.length > 0

  const steps = [
    { id: 1, title: 'Productos' },
    { id: 2, title: 'Pago' },
    { id: 3, title: 'Facturación' },
    { id: 4, title: 'Resumen' }
  ]

  const handleSubmit = async () => {
    if (!currentRegister) return

    try {
      setIsSubmitting(true)

      // Verificar que los pagos existan antes de enviar
      const { payments } = useSaleStore.getState()
      if (!payments || payments.length === 0) {
        // Recrear los pagos si es necesario, incluyendo datos de transferencia
        const { selectedMethods, paymentAmounts, getTransferData } = useSaleStore.getState()
        const currentPayments = selectedMethods.map((method) => {
          const payment = {
            method: method,
            amount: paymentAmounts[method] || 0
          }

          // Agregar datos adicionales para transferencias
          if (method === 'TRANSFER') {
            const transferData = getTransferData('TRANSFER')
            return {
              ...payment,
              customerPhone: transferData.customerPhone,
              transferReference: transferData.transferReference
            }
          }

          return payment
        })
        useSaleStore.getState().setPayments(currentPayments)
      }

      // Crear la venta
      const saleResult = await createSale(currentRegister._id)

      console.log(saleResult)

      // Registrar el uso de promoción si hay datos
      if (saleResult.sale && saleResult.sale._id) {
        console.log('Registrando uso de promoción')
        await handlePromotionRegistration(saleResult.sale._id)
      }

      toast.success('Venta realizada correctamente, actualizando...')
      await fetchCurrentRegister()
      if (handleCancel()) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al realizar la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <ProductSelector />
            <ComboSelector />
            <PromotionApplier />
          </>
        )
      case 2:
        return <PaymentForm />
      case 3:
        return <InvoiceForm />
      case 4:
        return (
          <>
            <SaleSummary />
            <div className='flex justify-end space-x-2 mt-4'>
              <Button
                variant='outline'
                onClick={() => handleCancel() && onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Finalizar Venta'}
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col w-[90%]'>
          <DialogHeader>
            <DialogTitle>
              {isMobile ? `${steps[step - 1].title} (${step}/4)` : 'Nueva Venta'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6 overflow-y-auto'>
            {/* Stepper - solo visible en desktop */}
            {!isMobile && (
              <div className='flex justify-between items-center sticky top-0 bg-background z-10 py-2 w-full px-1'>
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
                      min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center border
                      ${step >= s.id
                          ? 'border-primary bg-primary text-white'
                          : 'border-muted-foreground'
                        }
                    `}
                    >
                      {s.id}
                    </div>
                    <span className='ml-2'>{s.title}</span>
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
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {step < 4 && (
            <div className='flex justify-between mt-4 bottom-0 bg-background py-2'>
              <Button
                variant='outline'
                onClick={handleBack}
                disabled={step === 1}
              >
                Atrás
              </Button>
              <Button onClick={handleNext} disabled={step === 1 && !hasSaleItems}>
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
