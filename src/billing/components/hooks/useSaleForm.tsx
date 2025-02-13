import { useState, useMemo } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import { PaymentType, Invoice, Payment } from '../../../types/sale.types'
import { toast } from 'react-toastify'

export const useSaleForm = () => {
  const [step, setStep] = useState(1)
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(
    {}
  )
  const [selectedMethods, setSelectedMethods] = useState<PaymentType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    items,
    total,
    payments: existingPayments,
    invoice,
    setPayments,
    setInvoice,
    createSale,
    clearSale
  } = useSaleStore()

  const remaining = useMemo(() => {
    const totalPaid = Object.values(paymentAmounts).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    )
    return total - totalPaid
  }, [paymentAmounts, total])

  const handleNext = () => {
    if (step === 1 && !canAdvanceFromStep1()) {
      toast.error('Debe agregar al menos un producto')
      return
    }
    if (step === 2 && !canAdvanceFromStep2()) {
      toast.error('Debe completar el pago correctamente')
      return
    }
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handlePaymentSubmit = (payments: Payment[]) => {
    setPayments(payments)
    handleNext()
  }

  const handleInvoiceSubmit = (invoice: Invoice) => {
    setInvoice(invoice)
    handleNext()
  }

  const handleCancel = () => {
    clearSale()
    setStep(1)
    setPaymentAmounts({})
    setSelectedMethods([])
    setIsSubmitting(false)
    return true
  }

  const canAdvanceFromStep1 = () => items.length > 0
  const canAdvanceFromStep2 = () =>
    remaining === 0 && selectedMethods.length > 0

  const isStepAccessible = (targetStep: number) => {
    if (targetStep === 1) return true
    if (targetStep === 2) return canAdvanceFromStep1()
    if (targetStep === 3) return canAdvanceFromStep1() && canAdvanceFromStep2()
    if (targetStep === 4) return canAdvanceFromStep1() && canAdvanceFromStep2()
    return false
  }

  const updatePayment = (method: string, amount: number) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [method]: amount
    }))
  }

  return {
    step,
    remaining,
    selectedMethods,
    isSubmitting,
    items,
    total,
    payments: existingPayments,
    invoice,
    setStep,
    setPayments,
    setSelectedMethods,
    setIsSubmitting,
    handleNext,
    handleBack,
    handlePaymentSubmit,
    handleInvoiceSubmit,
    handleCancel,
    isStepAccessible,
    canAdvanceFromStep1,
    canAdvanceFromStep2,
    updatePayment,
    paymentAmounts,
    setPaymentAmounts
  }
}
