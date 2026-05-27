import { useState } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import { PaymentType, Bank } from '../../../types/sale.types'
import { toast } from 'react-toastify'
import { useActiveBanks } from '../../../hooks/useBanks'

export const useSaleForm = () => {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTransferConfirmation, setShowTransferConfirmation] = useState(false)
  const {
    items,
    total,
    payments,
    invoice,
    selectedMethods,
    remaining,
    paymentAmounts,
    paymentBanks,
    combos,
    promotionCustomerData,
    setInvoice,
    clearSale,
    setPayments,
    setSelectedMethods,
    clearPayments,
    updatePaymentAmount,
    getPaymentDetails,
    registerPromotionUsage,
    clearPromotionCustomerData
  } = useSaleStore()

  const { data: activeBanks } = useActiveBanks()
  const banksById = (activeBanks ?? []).reduce<Record<string, Bank>>((acc, b) => {
    acc[b._id] = b
    return acc
  }, {})

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

      // Validar datos de transferencia si se seleccionó TRANSFER
      if (selectedMethods.includes('TRANSFER')) {
        const transferData = useSaleStore.getState().getTransferData('TRANSFER')
        if (!transferData.customerPhone || transferData.customerPhone.trim() === '') {
          toast.error('El teléfono del cliente es obligatorio para transferencias')
          return
        }

        // Si hay transferencia, mostrar modal de confirmación antes de continuar
        setShowTransferConfirmation(true)
        return
      }

      // Validar datos de cuenta corriente si se seleccionó ACCOUNT_PAYABLE
      if (selectedMethods.includes('ACCOUNT_PAYABLE')) {
        const accountPayableData = getPaymentDetails('ACCOUNT_PAYABLE')
        if (!accountPayableData.accountPayableId && !accountPayableData.customerInfo) {
          toast.error('Debe seleccionar una cuenta existente o completar los datos del nuevo cliente')
          return
        }

        if (accountPayableData.customerInfo) {
          const { name, documentNumber } = accountPayableData.customerInfo
          if (!name || !documentNumber) {
            toast.error('Complete el nombre y documento del cliente para crear la nueva cuenta')
            return
          }
        }
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
      const currentPayments = selectedMethods.map((method) => {
        const baseAmount = paymentAmounts[method] || 0
        const payment: any = {
          method,
          amount: baseAmount
        }

        // Si es DEBIT o CREDIT con banco seleccionado, calcular recargo
        if ((method === 'DEBIT' || method === 'CREDIT') && paymentBanks[method]) {
          const bank = banksById[paymentBanks[method]]
          const pct = Number(bank?.surcharges?.[method] ?? 0)
          const surchargeAmount = Math.round(baseAmount * pct * 100 / 100) / 100
          payment.bank = paymentBanks[method]
          payment.amount = Math.round((baseAmount + surchargeAmount) * 100) / 100
          payment.surcharge = {
            applied: pct > 0,
            percentage: pct,
            amount: surchargeAmount,
            baseAmount: Math.round(baseAmount * 100) / 100
          }
        }

        // Agregar datos adicionales para transferencias
        if (method === 'TRANSFER') {
          const transferData = useSaleStore.getState().getTransferData('TRANSFER')
          payment.customerPhone = transferData.customerPhone
          payment.transferReference = transferData.transferReference
        }

        // Agregar datos adicionales para cuenta corriente
        if (method === 'ACCOUNT_PAYABLE') {
          const accountData = getPaymentDetails('ACCOUNT_PAYABLE')
          payment.accountPayableId = accountData.accountPayableId
          payment.customerInfo = accountData.customerInfo
        }

        return payment
      })
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

  /**
   * Maneja la confirmación del envío del comprobante de transferencia
   * @param confirmed - true si el comprobante fue enviado, false si no
   */
  const handleTransferConfirmation = async (confirmed: boolean) => {
    if (confirmed) {
      // Si se confirma el envío, continuar con el siguiente paso
      setStep((prev) => Math.min(prev + 1, 4))
    } else {
      // Si no se envió, mostrar mensaje informativo pero NO permitir continuar
      toast.error('Debe confirmar el envío del comprobante para continuar')
      // No avanzar al siguiente paso
    }
  }

  const handleCancel = () => {
    clearSale()
    clearPayments()
    clearPromotionCustomerData()
    setStep(1)
    setIsSubmitting(false)
    return true
  }

  /**
   * Función auxiliar para registrar el uso de promoción después de crear la venta
   * @param saleId - ID de la venta creada
   */
  const handlePromotionRegistration = async (saleId: string) => {
    if (promotionCustomerData) {
      try {
        console.log('Registrando uso de promoción para venta:', saleId)
        await registerPromotionUsage(saleId)
        console.log('Uso de promoción registrado exitosamente')
      } catch (error) {
        console.error('Error al registrar uso de promoción (no crítico):', error)
        // No mostramos error al usuario porque la venta ya se procesó correctamente
      }
    }
  }

  const isStepAccessible = (targetStep: number) => {
    if (targetStep === 1) return true
    if (targetStep === 2) return items.length > 0 || combos.length > 0
    if (targetStep === 3 || targetStep === 4) {
      return (
        (items.length > 0 || combos.length > 0) &&
        selectedMethods.length > 0 &&
        remaining === 0 &&
        selectedMethods.every((method) => {
          const hasValidAmount = (paymentAmounts[method] || 0) > 0

          if (method === 'TRANSFER') {
            const transferData = useSaleStore.getState().getTransferData('TRANSFER')
            return hasValidAmount && transferData.customerPhone
          }

          if (method === 'ACCOUNT_PAYABLE') {
            const accountData = getPaymentDetails('ACCOUNT_PAYABLE')
            return hasValidAmount && (accountData.accountPayableId || (
              accountData.customerInfo?.name && accountData.customerInfo?.documentNumber
            ))
          }

          return hasValidAmount
        })
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
    promotionCustomerData,
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
    updatePaymentAmount,
    showTransferConfirmation,
    setShowTransferConfirmation,
    handleTransferConfirmation,
    handlePromotionRegistration
  }
}
