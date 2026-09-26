import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSaleStore } from '../../stores/saleStore'
import { useCashRegisterStore } from '../../stores/cashRegisterStore'
import NewSaleDialog from './NewSaleDialog'
import { previewCheckout, submitCheckout, getFiscalConfig } from '../../services/checkout'
vi.mock('../../services/checkout', async original => ({ ...await original<typeof import('../../services/checkout')>(), previewCheckout: vi.fn(), submitCheckout: vi.fn(), getFiscalConfig: vi.fn() }))
vi.mock('../../hooks/useBanks', () => ({ useActiveBanks: () => ({ data: [] }) }))
vi.mock('./ReceiptActions', () => ({ default: () => <div>Documento de la venta guardada</div> }))
const product = { product: 'p', name: 'Producto prueba', quantity: 1, price: 100, subtotal: 100, stock: 10 }
const preview = { items: [product], combos: [], payments: [{ method: 'CASH', amount: 100 }], subtotal: 100, total: 100, remaining: 0, previewHash: 'hash', installmentPlans: [], transferSurcharge: { applied: false, amount: 0, percentage: 0 } }
const show = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><NewSaleDialog isOpen onOpenChange={() => {}} /></QueryClientProvider>)
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear()
  useSaleStore.getState().clearSale(); useSaleStore.getState().addItem(product); useSaleStore.getState().setSelectedMethods(['CASH'])
  useCashRegisterStore.setState({ currentRegister: { _id: 'cash', status: 'OPEN' } as never, fetchCurrentRegister: vi.fn() })
  vi.mocked(getFiscalConfig).mockResolvedValue({ configured: false, environment: 'homologation', pointOfSale: null, issuerCondition: null, standardA: false })
  vi.mocked(previewCheckout).mockResolvedValue(preview as never)
  vi.mocked(submitCheckout).mockResolvedValue({ sale: { _id: 'saved', total: 100, payments: [{ method: 'CASH', amount: 100 }], invoice: { type: 'X', pointOfSale: 1 } } } as never)
})
it('requires server review, submits one immutable operation and shows saved result', async () => {
  show(); expect(screen.queryByRole('button', { name: /Confirmar venta/ })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' }))
  const confirm = await screen.findByRole('button', { name: /Confirmar venta/ })
  fireEvent.click(confirm); fireEvent.click(confirm)
  await screen.findByText('Documento de la venta guardada')
  expect(submitCheckout).toHaveBeenCalledTimes(1); expect(vi.mocked(submitCheckout).mock.calls[0][0].previewHash).toBe('hash')
  expect(useSaleStore.getState().items).toEqual([]); expect(sessionStorage.length).toBe(0)
})
it('invalidates review when editable data changes', async () => {
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); await screen.findByRole('button', { name: /Confirmar venta/ })
  fireEvent.change(screen.getByLabelText('Notas de la venta'), { target: { value: 'Cambio' } })
  expect(screen.queryByRole('button', { name: /Confirmar venta/ })).toBeNull(); expect(submitCheckout).not.toHaveBeenCalled()
})
it('persists an ambiguous response and reuses key and payload after remount', async () => {
  vi.mocked(submitCheckout).mockRejectedValueOnce(new Error('Respuesta perdida'))
  const view = show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); fireEvent.click(await screen.findByRole('button', { name: /Confirmar venta/ }))
  await screen.findByRole('button', { name: 'Consultar y recuperar cobro' }); const original = vi.mocked(submitCheckout).mock.calls[0]
  expect(sessionStorage.length).toBe(1); view.unmount(); show()
  fireEvent.click(screen.getByRole('button', { name: 'Consultar y recuperar cobro' })); await screen.findByText('Documento de la venta guardada')
  expect(vi.mocked(submitCheckout).mock.calls[1]).toEqual(original)
})
it('a rejected price change preserves the cart and requires another review', async () => {
  vi.mocked(submitCheckout).mockRejectedValueOnce({ response: { status: 409, data: { details: 'Cambió la cotización' } } })
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); fireEvent.click(await screen.findByRole('button', { name: /Confirmar venta/ }))
  await screen.findByText('Cambió la cotización'); expect(useSaleStore.getState().items).toHaveLength(1); expect(sessionStorage.length).toBe(0)
  expect(screen.getByRole('button', { name: 'Revisar y continuar' })).toBeTruthy()
})
it('updates a changed server price and rebalances the only payment before review', async () => {
  vi.mocked(previewCheckout).mockResolvedValueOnce({ ...preview, items: [{ ...product, price: 120, originalPrice: 120, subtotal: 120 }], total: 120, subtotal: 120, remaining: 20 } as never)
  vi.mocked(previewCheckout).mockResolvedValueOnce({ ...preview, total: 120, subtotal: 120, payments: [{ method: 'CASH', amount: 120 }] } as never)
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); await screen.findByRole('button', { name: /Confirmar venta/ })
  expect(vi.mocked(previewCheckout).mock.calls[1][0].payments[0].baseAmount).toBe(120)
})
it('does not confirm mixed payments with a remaining difference', async () => {
  vi.mocked(previewCheckout).mockResolvedValue({ ...preview, remaining: 20 } as never)
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); await screen.findByText(/Distribuí los pagos/)
  expect(screen.queryByRole('button', { name: /Confirmar venta/ })).toBeNull()
})
it('requires the transfer receipt acknowledgement before saving', async () => {
  useSaleStore.getState().setSelectedMethods(['TRANSFER']); useSaleStore.getState().updateTransferData('TRANSFER', { customerPhone: '1133334444' })
  vi.mocked(previewCheckout).mockResolvedValue({ ...preview, payments: [{ method: 'TRANSFER', amount: 100 }] } as never)
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); const button = await screen.findByRole('button', { name: /Confirmar venta/ })
  expect((button as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByRole('checkbox', { name: /El cliente envió/ }))
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false))
})
it('accepts authoritative promotion changes without restoring the stale client discount', async () => {
  useSaleStore.getState().setPromotionCode('PROMO'); useSaleStore.getState().setDiscount(10)
  vi.mocked(previewCheckout).mockResolvedValueOnce({ ...preview, items: [{ ...product, originalPrice: 100, price: 80, subtotal: 80 }], subtotal: 80, total: 80, remaining: -10 } as never)
  vi.mocked(previewCheckout).mockResolvedValueOnce({ ...preview, subtotal: 80, total: 80, payments: [{ method: 'CASH', amount: 80 }] } as never)
  show(); fireEvent.click(screen.getByRole('button', { name: 'Revisar y continuar' })); await screen.findByRole('button', { name: /Confirmar venta/ })
  expect(useSaleStore.getState().total).toBe(80); expect(useSaleStore.getState().items[0].price).toBe(80)
  expect(vi.mocked(previewCheckout).mock.calls[1][0].payments[0].baseAmount).toBe(80)
})
