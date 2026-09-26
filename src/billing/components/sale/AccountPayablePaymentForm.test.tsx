import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountPayablePaymentForm } from './AccountPayablePaymentForm'
import { useSaleStore } from '../../../stores/saleStore'
vi.mock('../../../hooks/useInstallmentPlans', () => ({ useInstallmentPlans: () => ({ data: { plans: [{ installments: 3, interestRate: 10, label: '3 cuotas', isActive: true }], defaultFrequency: 'MONTHLY' } }) }))
const show = () => render(<QueryClientProvider client={new QueryClient()}><AccountPayablePaymentForm onDataChange={data => useSaleStore.getState().updatePaymentDetails('ACCOUNT_PAYABLE', data)} /></QueryClientProvider>)
beforeEach(() => { useSaleStore.getState().clearSale(); useSaleStore.setState({ total: 100, paymentAmounts: { ACCOUNT_PAYABLE: 60, CASH: 40 } }) })
it('keeps plan selection when customer fields change and finances only the assigned portion', () => {
  show(); fireEvent.click(screen.getByRole('button', { name: 'Crear nuevo cliente' }))
  fireEvent.change(screen.getByLabelText('Nombre del Cliente *'), { target: { value: 'Demo' } })
  fireEvent.change(screen.getByLabelText('Número *'), { target: { value: '11111111' } })
  fireEvent.change(screen.getByLabelText('Plan de cuotas'), { target: { value: '0' } })
  fireEvent.change(screen.getByLabelText('Nombre del Cliente *'), { target: { value: 'Demo editado' } })
  const details = useSaleStore.getState().paymentDetails.ACCOUNT_PAYABLE
  expect(details.installmentPlanIndex).toBe(0); expect(details.customerInfo.name).toBe('Demo editado')
  expect(screen.getAllByText(/66,00/).length).toBeGreaterThan(0)
})
it('restores customer and financing after closing and reopening the draft', () => {
  useSaleStore.getState().updatePaymentDetails('ACCOUNT_PAYABLE', { installmentPlanIndex: 0, customerInfo: { name: 'Demo', documentType: 'DNI', documentNumber: '11111111' } })
  show(); expect((screen.getByLabelText('Nombre del Cliente *') as HTMLInputElement).value).toBe('Demo')
  expect((screen.getByLabelText('Plan de cuotas') as HTMLSelectElement).value).toBe('0')
})
