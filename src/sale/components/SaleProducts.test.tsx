import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SaleItem } from '../../types/sale.types'
import { formatCurrency } from '../../utils'
import SaleProducts from './SaleProducts'

const usdPricing = {
  currency: 'USD',
  priceUSD: 10,
  rateType: 'blue',
  rateValue: 1000,
  surchargeArs: 50,
  calculatedPriceArs: 10500,
  valueKind: 'venta'
} satisfies NonNullable<SaleItem['pricingSnapshot']>

const showProduct = (pricingSnapshot: unknown, deleted = false) => render(
  <SaleProducts items={[{
    product: deleted ? null : { _id: 'product-1', name: 'Remera', code: 'REM-1' },
    quantity: 2,
    price: 9000,
    subtotal: 18000,
    // API responses can include incomplete snapshots despite the declared type.
    pricingSnapshot: pricingSnapshot as SaleItem['pricingSnapshot']
  }]} />
)

describe('SaleProducts', () => {
  it.each([
    undefined,
    null,
    {},
    { stale: false },
    { ...usdPricing, priceUSD: undefined },
    { ...usdPricing, priceUSD: null },
    { ...usdPricing, priceUSD: NaN },
    { ...usdPricing, rateValue: undefined },
    { ...usdPricing, calculatedPriceArs: undefined }
  ])('renders saved sale prices without a complete USD snapshot: %j', (snapshot) => {
    const { container } = showProduct(snapshot)
    expect(screen.getByText('Remera')).toBeTruthy()
    expect(screen.queryByText(/USD/)).toBeNull()
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell')
    expect(cells[3].textContent).toBe(formatCurrency(9000))
    expect(cells[4].textContent).toBe(formatCurrency(9000))
    expect(cells[5].textContent).toBe(formatCurrency(18000))
    expect(container.textContent).not.toMatch(/NaN|undefined/)
  })

  it.each([undefined, 1100])('preserves the historical USD conversion (effective rate: %s)', (effectiveRateValue) => {
    showProduct({ ...usdPricing, effectiveRateValue })
    const conversion = screen.getByText(/USD 10 ×/)
    expect(conversion.textContent).toBe(
      `USD 10 × ${formatCurrency(effectiveRateValue ?? 1050)} = ${formatCurrency(10500)}`
    )
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell')
    expect(cells[3].textContent).toBe(formatCurrency(10500))
    expect(cells[4].textContent).toBe(formatCurrency(9000))
    expect(cells[5].textContent).toBe(formatCurrency(18000))
  })

  it('renders a deleted product with a default-only pricing snapshot', () => {
    showProduct({ stale: false }, true)
    expect(screen.getByText('Producto eliminado')).toBeTruthy()
    expect(screen.getByText('Sin referencia')).toBeTruthy()
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell')
    expect(cells[5].textContent).toBe(formatCurrency(18000))
  })
})
