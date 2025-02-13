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
import { ProductSelector, PaymentForm, InvoiceForm, SaleSummary } from './sale'
import { useSaleForm } from './hooks/useSaleForm'

interface NewSaleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const NewSaleDialog = ({ isOpen, onOpenChange }: NewSaleDialogProps) => {
  const { currentRegister } = useCashRegisterStore()
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
    isStepAccessible
  } = useSaleForm()

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
      await createSale(currentRegister._id)
      toast.success('Venta realizada correctamente')
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
        return <ProductSelector />
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className='space-y-6 flex-1 overflow-y-auto'>
          {/* Stepper */}
          <div className='flex justify-between sticky top-0 bg-background z-10 py-2'>
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex items-center cursor-pointer ${
                  step >= s.id ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => {
                  if (s.id < step || isStepAccessible(s.id)) {
                    setStep(s.id)
                  }
                }}
              >
                <div
                  className={`
                  w-8 h-8 rounded-full flex items-center justify-center border
                  ${
                    step >= s.id
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
                    className={`w-full h-[2px] mx-4 ${
                      step > s.id ? 'bg-primary' : 'bg-muted-foreground'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          {renderStepContent()}
        </div>

        {/* Navigation - hacerlo sticky al fondo */}
        {step < 4 && items.length > 0 && (
          <div className='flex justify-between mt-4 sticky bottom-0 bg-background py-2'>
            <Button
              variant='outline'
              onClick={handleBack}
              disabled={step === 1}
            >
              Atrás
            </Button>
            <Button onClick={handleNext}>Siguiente</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default NewSaleDialog
