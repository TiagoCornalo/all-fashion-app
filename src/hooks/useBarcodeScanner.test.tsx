import { afterEach, expect, it, vi } from 'vitest'
import { renderHook, fireEvent } from '@testing-library/react'
import { useBarcodeScanner } from './useBarcodeScanner'
let elapsed = 10
const typeCode = (target: HTMLElement) => {
  vi.spyOn(performance, 'now').mockImplementation(() => elapsed += 10)
  for (const key of ['1', '2', '3', '4', 'Enter']) fireEvent.keyDown(target, { key })
}
afterEach(() => document.querySelectorAll('input').forEach(input => input.remove()))
it('does not treat a phone or document field as a barcode', () => {
  const onScan = vi.fn(); renderHook(() => useBarcodeScanner({ onScan }))
  const input = document.createElement('input'); document.body.append(input); typeCode(input)
  expect(onScan).not.toHaveBeenCalled()
})
it('accepts a rapid scanner sequence in the dedicated product search field', () => {
  const onScan = vi.fn(); renderHook(() => useBarcodeScanner({ onScan }))
  const input = document.createElement('input'); input.dataset.barcodeInput = ''; document.body.append(input); typeCode(input)
  expect(onScan).toHaveBeenCalledWith('1234')
})
it('disables barcode collection while the checkout is saving', () => {
  const onScan = vi.fn(); renderHook(() => useBarcodeScanner({ onScan, enabled: false })); typeCode(document.body)
  expect(onScan).not.toHaveBeenCalled()
})
