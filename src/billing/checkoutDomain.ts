import { useSaleStore } from '../stores/saleStore'
import { CheckoutRequest } from '../services/checkout'
type Draft = ReturnType<typeof useSaleStore.getState>
export const paymentLabels: Record<string, string> = { CASH: 'Efectivo', DEBIT: 'Débito', CREDIT: 'Crédito', TRANSFER: 'Transferencia', ACCOUNT_PAYABLE: 'Cuenta corriente' }
export function buildCheckoutRequest(state: Draft, cashRegister: string): CheckoutRequest {
  return {
    items: state.items.map(({ product, quantity }) => ({ product, quantity })),
    combos: state.combos.map(({ comboId, quantity }) => ({ comboId, quantity })),
    invoice: { ...state.invoice, type: state.invoice.type === 'TICKET' ? 'X' : state.invoice.type },
    payments: state.selectedMethods.map(method => ({ method,
      amount: state.paymentAmounts[method] || 0, baseAmount: state.paymentAmounts[method] || 0,
      ...(['DEBIT', 'CREDIT'].includes(method) && state.paymentBanks[method] ? { bank: state.paymentBanks[method] } : {}),
      ...(method === 'TRANSFER' ? state.transferData.TRANSFER : {}),
      ...(method === 'ACCOUNT_PAYABLE' ? (({ accountPayableId, customerInfo, installmentPlanIndex, installmentFrequencyOverride }) => ({ accountPayableId, customerInfo, installmentPlanIndex, installmentFrequencyOverride }))(state.paymentDetails.ACCOUNT_PAYABLE || {}) : {})
    })),
    notes: state.notes, cashRegister, promotionCode: state.promotionCode,
    itemPromotions: state.itemPromotions.map(({ itemIndex, promotionCode }) => ({ itemIndex, promotionCode })),
    ...(state.promotionCustomerData ? { promotionCustomerData: state.promotionCustomerData } : {})
  }
}
export function validateCheckoutDraft(state: Draft, cashRegister?: string): string | null {
  if (!cashRegister) return 'Abrí una caja antes de vender.'
  if (!state.items.length && !state.combos.length) return 'Agregá un producto o combo.'
  if (!state.selectedMethods.length) return 'Elegí al menos un medio de pago.'
  if (state.selectedMethods.some(m => !Number.isFinite(state.paymentAmounts[m]) || state.paymentAmounts[m] <= 0)) return 'Ingresá un importe positivo para cada medio de pago.'
  if (state.selectedMethods.includes('TRANSFER') && !/^[+]?[0-9\s\-()]{8,15}$/.test(state.transferData.TRANSFER?.customerPhone || '')) return 'Completá un teléfono válido para la transferencia.'
  if (state.selectedMethods.includes('ACCOUNT_PAYABLE')) {
    const data = state.paymentDetails.ACCOUNT_PAYABLE
    if (!data?.accountPayableId && (!data?.customerInfo?.name?.trim() || !data?.customerInfo?.documentNumber?.trim())) return 'Seleccioná una cuenta corriente o completá los datos del cliente.'
  }
  return null
}
