import { useState } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import { PaymentType } from '../../../types/sale.types'
import { toast } from 'react-toastify'

export const useSaleForm = () => {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    items,
    total,
    payments,
    invoice,
    selectedMethods,
    remaining,
    paymentAmounts,
    combos,
    setInvoice,
    clearSale,
    setPayments,
    setSelectedMethods,
    clearPayments,
    updatePaymentAmount
  } = useSaleStore()

  const handleNext = () => {
    if (step === 1 && items.length === 0 && combos.length === 0) {
      toast.error('Debe agregar al menos un producto o combo')
      return
    }

    if (step === 2) {
      if (selectedMethods.length === 0) {
        toast.error('Debe seleccionar al menos un método de pago')
        return
      }

      if (remaining !== 0) {
        toast.error('El monto total debe ser cubierto completamente')
        return
      }

      const hasValidAmounts = selectedMethods.every(
        (method) => (paymentAmounts[method] || 0) > 0
      )

      if (!hasValidAmounts) {
        toast.error(
          'Debe ingresar montos válidos para todos los métodos de pago'
        )
        return
      }
    }

    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleInvoiceSubmit = () => {
    // Guarda la información de la factura
    setInvoice(invoice)

    // Asegúrate de que los pagos estén correctamente configurados antes de continuar
    if (selectedMethods.length > 0) {
      const currentPayments = selectedMethods.map((method) => ({
        method: method,
        amount: paymentAmounts[method] || 0
      }))
      console.log('currentPayments', currentPayments)

      // Guardar explícitamente los pagos en el store
      setPayments(currentPayments)
    } else {
      // Manejo de error - no hay métodos de pago seleccionados
      toast.error('No hay métodos de pago seleccionados')
      return
    }

    // Avanzar al siguiente paso
    handleNext()
  }

  const handleCancel = () => {
    clearSale()
    clearPayments()
    setStep(1)
    setIsSubmitting(false)
    return true
  }

  const isStepAccessible = (targetStep: number) => {
    if (targetStep === 1) return true
    if (targetStep === 2) return items.length > 0 || combos.length > 0
    if (targetStep === 3 || targetStep === 4) {
      return (
        (items.length > 0 || combos.length > 0) &&
        selectedMethods.length > 0 &&
        remaining === 0 &&
        selectedMethods.every((method) => (paymentAmounts[method] || 0) > 0)
      )
    }
    return false
  }

  const updatePayment = (method: string, amount: number) => {
    updatePaymentAmount(method as PaymentType, amount)
  }

  return {
    step,
    remaining,
    selectedMethods,
    isSubmitting,
    items,
    total,
    payments,
    invoice,
    setInvoice,
    setStep,
    setPayments,
    setSelectedMethods,
    setIsSubmitting,
    handleNext,
    handleBack,
    handleInvoiceSubmit,
    handleCancel,
    isStepAccessible,
    canAdvanceFromStep1: items.length > 0 || combos.length > 0,
    canAdvanceFromStep2: selectedMethods.length > 0 && remaining === 0,
    updatePayment,
    paymentAmounts,
    updatePaymentAmount
  }
}
