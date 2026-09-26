import { expect, it } from 'vitest'
import { formatArs, validateLabelBatch } from './labelDocument'
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
