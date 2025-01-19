import { useState } from 'react'
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

interface NewSaleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const NewSaleDialog = ({ isOpen, onOpenChange }: NewSaleDialogProps) => {
  const [step, setStep] = useState(1)
  const [remaining, setRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { currentRegister } = useCashRegisterStore()
  const { items, total, createSale, clearSale } = useSaleStore()

  const steps = [
    { id: 1, title: 'Productos' },
    { id: 2, title: 'Pago' },
    { id: 3, title: 'Facturación' },
    { id: 4, title: 'Resumen' }
  ]

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4))
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <ProductSelector />
      case 2:
        return (
          <>
            <PaymentForm
              total={total}
              onComplete={handleNext}
              remaining={remaining}
              setRemaining={setRemaining}
            />
            <div className='flex justify-end mt-4'>
              <Button onClick={handleBack} variant='outline' className='mr-2'>
                Atrás
              </Button>
              <Button onClick={handleNext} disabled={remaining !== 0}>
                Continuar
              </Button>
            </div>
          </>
        )
      case 3:
        return <InvoiceForm onComplete={handleNext} />
      case 4:
        return (
          <>
            <SaleSummary />
            <div className='flex justify-end space-x-2 mt-4'>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
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

  const handleSubmit = async () => {
    if (!currentRegister) return

    try {
      setIsSubmitting(true)
      await createSale(currentRegister._id)
      toast.success('Venta realizada correctamente')
      clearSale()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Error al realizar la venta')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Stepper */}
          <div className='flex justify-between'>
            {steps.map((s) => (
              <div
                key={s.id}
                className={`flex items-center ${
                  step >= s.id ? 'text-primary' : 'text-muted-foreground'
                }`}
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

          {/* Navigation */}
          {step < 4 && items.length > 0 && (
            <div className='flex justify-between mt-4'>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewSaleDialog
