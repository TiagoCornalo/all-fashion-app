import { useMemo } from 'react'
import { useSaleStore } from '../../../stores/saleStore'
import { useActiveBanks } from '../../../hooks/useBanks'
import { Bank, Payment, PaymentSurcharge } from '../../../types/sale.types'

export interface SurchargeByMethod {
  pct: number
  amount: number
  bankId: string
  bankName: string
}

export interface SaleTotals {
  subtotal: number
  totalSurcharge: number
  totalToCharge: number
  surchargeByMethod: Record<string, SurchargeByMethod>
  paymentsForBackend: Payment[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Fuente única de verdad del cálculo de totales en la venta.
 *
 * Toma el estado en vivo de la venta (subtotal de productos, métodos elegidos,
 * montos base y bancos seleccionados) y devuelve:
 * - Recargo por cada método (sólo DEBIT/CREDIT con banco)
 * - Recargo total
 * - Total a cobrar al cliente (subtotal + recargos)
 * - Lista de payments lista para enviar al backend, con surcharge y amount final
 */
export const useSaleTotals = (): SaleTotals => {
  const {
    total: subtotal,
    selectedMethods,
    paymentAmounts,
    paymentBanks,
    transferData,
    paymentDetails
  } = useSaleStore()

  const { data: activeBanks = [] } = useActiveBanks()

  return useMemo(() => {
    const banksById: Record<string, Bank> = {}
    for (const b of activeBanks) banksById[b._id] = b

    const surchargeByMethod: Record<string, SurchargeByMethod> = {}
    const paymentsForBackend: Payment[] = []

    for (const method of selectedMethods) {
      const baseAmount = round2(paymentAmounts[method] || 0)
      const payment: Payment = { method, amount: baseAmount }

      if ((method === 'DEBIT' || method === 'CREDIT') && paymentBanks[method]) {
        const bank = banksById[paymentBanks[method]]
        const pct = Number(bank?.surcharges?.[method] ?? 0)
        if (bank && pct > 0 && baseAmount > 0) {
          const surchargeAmount = round2(baseAmount * pct / 100)
          surchargeByMethod[method] = {
            pct,
            amount: surchargeAmount,
            bankId: bank._id,
            bankName: bank.name
          }
          const surcharge: PaymentSurcharge = {
            applied: true,
            percentage: pct,
            amount: surchargeAmount,
            baseAmount
          }
          payment.bank = bank._id
          payment.surcharge = surcharge
          payment.amount = round2(baseAmount + surchargeAmount)
        } else if (bank) {
          payment.bank = bank._id
        }
      }

      if (method === 'TRANSFER') {
        const t = transferData['TRANSFER'] || {}
        payment.customerPhone = t.customerPhone
        payment.transferReference = t.transferReference
      }

      if (method === 'ACCOUNT_PAYABLE') {
        const a = paymentDetails['ACCOUNT_PAYABLE'] || {}
        ;(payment as any).accountPayableId = a.accountPayableId
        ;(payment as any).customerInfo = a.customerInfo
        if (a.installmentPlanIndex !== undefined && a.installmentPlanIndex !== null) {
          ;(payment as any).installmentPlanIndex = a.installmentPlanIndex
        }
        if (a.installmentFrequencyOverride) {
          ;(payment as any).installmentFrequencyOverride = a.installmentFrequencyOverride
        }
      }

      paymentsForBackend.push(payment)
    }

    const totalSurcharge = Object.values(surchargeByMethod).reduce(
      (sum, s) => sum + s.amount,
      0
    )

    return {
      subtotal,
      totalSurcharge: round2(totalSurcharge),
      totalToCharge: round2(subtotal + totalSurcharge),
      surchargeByMethod,
      paymentsForBackend
    }
  }, [
    subtotal,
    selectedMethods,
    paymentAmounts,
    paymentBanks,
    transferData,
    paymentDetails,
    activeBanks
  ])
}
