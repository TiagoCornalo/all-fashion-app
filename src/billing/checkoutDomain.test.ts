import { beforeEach, describe, expect, it } from 'vitest'
import { useSaleStore } from '../stores/saleStore'
import { buildCheckoutRequest, validateCheckoutDraft } from './checkoutDomain'
const store = () => useSaleStore.getState()
const add = (id = 'p', price = 100) => store().addItem({ product: id, name: id, price, quantity: 1, subtotal: price, stock: 10 })
beforeEach(() => store().clearSale())
describe('checkout draft regressions', () => {
  it('prunes deselected payments and their bank, then assigns the full base to a single method', () => {
    add(); store().setSelectedMethods(['CASH', 'CREDIT']); store().updatePaymentAmount('CASH', 40); store().updatePaymentAmount('CREDIT', 60); store().setPaymentBank('CREDIT', 'bank')
    store().setSelectedMethods(['CASH'])
    expect(store().paymentAmounts).toEqual({ CASH: 100 }); expect(store().paymentBanks).toEqual({}); expect(store().remaining).toBe(0)
  })
  it('reindexes an item promotion when a preceding product is removed', () => {
    add('first'); add('second'); store().addItemPromotion(1, 'TEN', 10); store().removeItem('first'); store().removeItem('first')
    expect(store().itemPromotions[0].itemIndex).toBe(0); expect(store().items[0].price).toBe(90)
    expect(buildCheckoutRequest(store(), 'cash').itemPromotions).toEqual([{ itemIndex: 0, promotionCode: 'TEN' }])
  })
  it('stacks promotions once and restores the remaining discount on removal', () => {
    add(); store().addItemPromotion(0, 'TEN', 10); store().setPromotionCode('TWENTY'); store().setDiscount(20)
    expect(store().total).toBe(72); store().updateItemQuantity('p', 2); expect(store().total).toBe(144)
    store().removeItemPromotion(0); expect(store().total).toBe(160)
    store().addItemPromotion(0, 'TEN', 10); store().removeGlobalPromotion(); expect(store().total).toBe(180)
  })
  it('applies a global promotion to newly added products, excluding combos', () => {
    add(); store().setPromotionCode('TEN'); store().setDiscount(10); add('second', 50); store().addCombo({ comboId: 'combo', quantity: 1, price: 20 })
    expect(store().total).toBe(155)
  })
  it('rounds money and prevents fractional or excessive quantities', () => {
    add('p', 0.1); store().updateItemQuantity('p', 3); expect(store().total).toBe(0.3)
    store().updateItemQuantity('p', 1.5); store().updateItemQuantity('p', 99); expect(store().items[0].quantity).toBe(3)
  })
  it('clears bank and account data after a sale', () => {
    store().setPaymentBank('CREDIT', 'bank'); store().updatePaymentDetails('ACCOUNT_PAYABLE', { accountPayableId: 'customer' }); store().clearSale()
    expect(store().paymentBanks).toEqual({}); expect(store().paymentDetails).toEqual({})
  })
  it('requires transfer identity and account details before server review', () => {
    expect(validateCheckoutDraft(store())).toContain('caja'); add(); store().setSelectedMethods(['TRANSFER'])
    expect(validateCheckoutDraft(store(), 'cash')).toContain('teléfono')
    store().updateTransferData('TRANSFER', { customerPhone: '1133334444' }); expect(validateCheckoutDraft(store(), 'cash')).toBeNull()
    store().setSelectedMethods(['ACCOUNT_PAYABLE']); expect(validateCheckoutDraft(store(), 'cash')).toContain('cuenta')
  })
  it('sends base payments and rate-independent product identifiers to the server', () => {
    add(); store().setSelectedMethods(['CREDIT']); store().setPaymentBank('CREDIT', 'bank')
    const request = buildCheckoutRequest(store(), 'cash')
    expect(request.items).toEqual([{ product: 'p', quantity: 1 }]); expect(request.payments[0]).toEqual({ method: 'CREDIT', amount: 100, baseAmount: 100, bank: 'bank' }); expect(request.invoice.type).toBe('X')
  })
})
