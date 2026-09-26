import { expect, it } from 'vitest'
import { createLabelPdf, formatArs, getLabelLayout, validateLabelBatch } from './labelDocument'
import { PreparedProductLabel } from '../types/barcode.types'
const label: PreparedProductLabel = { product: { _id: 'p1', code: 'P1', name: 'Demo', price: 10.25 }, barcode: { value: 'FINABC123', normalizedValue: 'FINABC123', format: 'CODE128', origin: 'INTERNAL', unitsPerScan: 1, isPrimary: false } }
it.each([0, -1, 1.5, NaN, Infinity, 1000])('rejects invalid label copies %s', count => {
  expect(() => validateLabelBatch([label], { p1: count })).toThrow('enteras')
})
it('caps a single batch without capping future reprints', () => {
  const second = { ...label, product: { ...label.product, _id: 'p2' } }
  expect(() => validateLabelBatch([label, second], { p1: 999, p2: 2 })).toThrow('1000')
  expect(validateLabelBatch([label, second], { p1: 999, p2: 1 })).toBe(1000)
  expect(validateLabelBatch([label], { p1: 1 })).toBe(1)
})
it('does not label single products with multipack codes or unsupported characters', () => {
  expect(() => validateLabelBatch([{ ...label, barcode: { ...label.barcode, unitsPerScan: 6 } }], { p1: 1 })).toThrow('varias unidades')
  expect(() => validateLabelBatch([{ ...label, barcode: { ...label.barcode, value: 'ABC😀' } }], { p1: 1 })).toThrow('incompatible')
  expect(formatArs(10.25)).toContain('10,25')
})

const customerLabel: PreparedProductLabel = {
  ...label,
  product: { ...label.product, name: 'Sillon Nico Grande', code: '103672' },
  barcode: { ...label.barcode, value: 'FIN0AA285A4C2B3' }
}

it.each([false, true])('enlarges the reported barcode without changing its center or page size (price: %s)', includePrice => {
  const layout = getLabelLayout(customerLabel, includePrice)
  expect([layout.width, layout.height]).toEqual([50, 30])
  expect(layout.barcodeX + layout.barcodeWidth / 2).toBe(25.5)
  expect(layout.barcodeWidth).toBeCloseTo(44)
  expect(layout.barcodeHeight).toBeGreaterThanOrEqual(15)
  expect(layout.barcodeTextSize).toBe(6.5)
})

it.each(['123', '7791234567890', 'FIN0AA285A4C2B3', 'A'.repeat(40)])('keeps tall bars, white side margins and separate text for %s', value => {
  const longName = { ...customerLabel, product: { ...customerLabel.product, name: 'Sillón reclinable de tres cuerpos con almohadones de respaldo desmontables y tapizado lavable color gris oscuro' }, barcode: { ...label.barcode, value } }
  const layout = getLabelLayout(longName, true)
  expect(layout.nameLines.length).toBeLessThanOrEqual(2)
  expect(layout.barcodeHeight).toBeGreaterThanOrEqual(12)
  expect(layout.barcodeY).toBeGreaterThan(layout.codeY)
  expect(layout.barcodeY + layout.barcodeHeight).toBeLessThan(layout.barcodeTextY)
  expect(layout.barcodeTextY).toBeLessThan(layout.priceY - 8 * 25.4 / 72)
  expect(layout.barcodeX + 1e-8).toBeGreaterThanOrEqual(layout.moduleWidth * 10)
  expect(layout.width - layout.barcodeX - layout.barcodeWidth + 1e-8).toBeGreaterThanOrEqual(layout.moduleWidth * 10)
  expect(layout.bars.every(bar => bar.width > 0 && bar.x >= 0 && bar.x + bar.width <= 50)).toBe(true)
})

it('writes vector bars and the unchanged barcode as text on every 50x30 page', () => {
  const pdf = createLabelPdf([customerLabel], { p1: 2 }, true)
  expect(pdf.getNumberOfPages()).toBe(2)
  for (let page = 1; page <= 2; page++) {
    pdf.setPage(page)
    expect(pdf.internal.pageSize.getWidth()).toBeCloseTo(50)
    expect(pdf.internal.pageSize.getHeight()).toBeCloseTo(30)
    // jsPDF types pages as number[], although its content streams are string[].
    const content = (pdf.internal.pages as unknown as string[][])[page].join('\n')
    expect(content).toContain('(FIN0AA285A4C2B3)')
    expect(content).toContain(' re\nf')
    expect(content).not.toContain('/I0 Do')
  }
})
