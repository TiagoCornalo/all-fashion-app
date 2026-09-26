import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { BarcodeManagerDialog } from './BarcodeManagerDialog'
import { Product } from '../../types/inventory.types'
const mocks = vi.hoisted(() => ({ get: vi.fn(), add: vi.fn(), generate: vi.fn(), deactivate: vi.fn(), receipt: vi.fn(), prepare: vi.fn(), pdf: vi.fn(), autoPrint: vi.fn(), refresh: vi.fn() }))
vi.mock('../../services/barcode.service', () => ({
  getProductBarcodes: mocks.get, addProductBarcode: mocks.add, generateInternalProductBarcode: mocks.generate,
  deactivateProductBarcode: mocks.deactivate, createInventoryReceipt: mocks.receipt, prepareProductLabels: mocks.prepare, searchLabelProducts: vi.fn()
}))
vi.mock('jsbarcode', () => ({ default: vi.fn() }))
vi.mock('../../services/labelDocument', async original => ({ ...(await original<typeof import('../../services/labelDocument')>()), createLabelPdf: mocks.pdf }))
const product = { _id: 'p1', code: 'P1', name: 'Producto demo', price: 20, stock: 5 } as Product
const barcode = { _id: 'b1', value: 'FIN123ABC', normalizedValue: 'FIN123ABC', format: 'CODE128', origin: 'INTERNAL', unitsPerScan: 1 }
const show = () => render(<BarcodeManagerDialog open product={product} onOpenChange={() => {}} onUpdated={mocks.refresh} />)
const amount = (value: string) => fireEvent.change(screen.getByLabelText('Cantidad recibida'), { target: { value } })
const confirm = () => screen.getByRole('button', { name: 'Confirmar ingreso de stock' })
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear()
  localStorage.setItem('user', JSON.stringify({ _id: 'admin', role: 'ADMIN' }))
  mocks.get.mockResolvedValue([barcode]); mocks.generate.mockResolvedValue(barcode); mocks.add.mockResolvedValue(barcode)
  mocks.refresh.mockResolvedValue(undefined)
  mocks.receipt.mockResolvedValue({ receipt: { _id: 'r1', totalUnits: 3, items: [{ product: { _id: 'p1', stock: 8 }, stockBefore: 5, stockAfter: 8, quantity: 3 }] }, repeatedRequest: false })
  mocks.prepare.mockResolvedValue([{ product, barcode }])
  mocks.pdf.mockReturnValue({ autoPrint: mocks.autoPrint, output: () => new Blob(['pdf']) })
  vi.spyOn(window, 'open').mockReturnValue({ opener: null, location: { replace: vi.fn() }, close: vi.fn() } as unknown as Window)
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:labels') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
})
it('generates a unit barcode, confirms stock once and prints the selected code with received copies', async () => {
  mocks.get.mockResolvedValue([])
  show()
  const generate = screen.getByRole('button', { name: 'Generar código interno' })
  await waitFor(() => expect((generate as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(generate)
  await screen.findByText('FIN123ABC')
  await waitFor(() => expect((screen.getByLabelText('Cantidad recibida') as HTMLInputElement).disabled).toBe(false))
  amount('3')
  act(() => { fireEvent.click(confirm()); fireEvent.click(confirm()) })
  await screen.findByText('8 unidades')
  expect(mocks.receipt).toHaveBeenCalledTimes(1)
  expect(mocks.receipt.mock.calls[0][0].items).toEqual([{ productId: 'p1', barcodeValue: 'FIN123ABC', quantity: 3 }])
  await waitFor(() => expect((screen.getByRole('button', { name: 'Imprimir etiquetas' }) as HTMLButtonElement).disabled).toBe(false))
  expect(mocks.prepare).toHaveBeenCalledWith(['p1'], 'PRIMARY_OR_INTERNAL', { p1: 'b1' })
  expect((screen.getByLabelText('Copias de Producto demo') as HTMLInputElement).value).toBe('3')
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir etiquetas' }))
  expect(mocks.pdf.mock.calls[0][1]).toEqual({ p1: 3 })
  expect(mocks.autoPrint).toHaveBeenCalledTimes(1)
  expect(mocks.receipt).toHaveBeenCalledTimes(1)
  expect(sessionStorage.length).toBe(0)
})
it('captures a manufacturer barcode once despite two terminators and does not change stock', async () => {
  mocks.get.mockResolvedValue([])
  show()
  const input = screen.getByLabelText('Código del fabricante')
  await waitFor(() => expect((input as HTMLInputElement).disabled).toBe(false))
  let time = 10
  vi.spyOn(performance, 'now').mockImplementation(() => time += 10)
  for (const [i, key] of [...'7791234567890'].entries()) {
    fireEvent.keyDown(input, { key })
    fireEvent.change(input, { target: { value: '7791234567890'.slice(0, i + 1) } })
  }
  act(() => { fireEvent.keyDown(input, { key: 'Enter' }); fireEvent.keyDown(input, { key: 'Enter' }) })
  await waitFor(() => expect(mocks.add).toHaveBeenCalledTimes(1))
  expect(mocks.add).toHaveBeenCalledWith('p1', { value: '7791234567890', origin: 'MANUFACTURER', isPrimary: true, unitsPerScan: 1 })
  expect(mocks.receipt).not.toHaveBeenCalled()
})
it('keeps immutable stock operation across a lost response, close and reopen', async () => {
  mocks.receipt.mockRejectedValueOnce(new Error('Respuesta perdida'))
  const view = show()
  await screen.findByText('FIN123ABC'); amount('3'); fireEvent.click(confirm())
  await screen.findByText('Respuesta perdida')
  const operation = mocks.receipt.mock.calls[0][0]
  expect((screen.getByLabelText('Cantidad recibida') as HTMLInputElement).disabled).toBe(true)
  view.unmount(); show()
  const retry = await screen.findByRole('button', { name: 'Consultar ingreso pendiente' })
  await waitFor(() => expect((retry as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(retry)
  await screen.findByText('8 unidades')
  expect(mocks.receipt.mock.calls[1][0]).toEqual(operation)
  expect(sessionStorage.length).toBe(0)
})
it('preserves existing pack codes and does not confuse quantity received with units per scan', async () => {
  mocks.get.mockResolvedValue([{ ...barcode, unitsPerScan: 2 }])
  show(); await screen.findByText('2 unidades por lectura')
  expect((screen.getByRole('button', { name: 'Preparar etiquetas' }) as HTMLButtonElement).disabled).toBe(true)
  amount('3'); fireEvent.click(confirm())
  await screen.findByText('8 unidades')
  expect(mocks.receipt.mock.calls[0][0].items[0].quantity).toBe(3)
  expect(mocks.add).not.toHaveBeenCalled()
})
it('rejects another product barcode without allowing a stock receipt for the unsaved code', async () => {
  mocks.add.mockRejectedValueOnce(new AxiosError('Conflicto', undefined, undefined, undefined, { status: 409, data: { error: 'Este código ya pertenece a otro producto' } } as never))
  show(); await screen.findByText('FIN123ABC')
  fireEvent.change(screen.getByLabelText('Código del fabricante'), { target: { value: 'OTHER' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar código' }))
  await screen.findByText('Este código ya pertenece a otro producto')
  amount('3')
  expect((confirm() as HTMLButtonElement).disabled).toBe(true)
  expect(mocks.receipt).not.toHaveBeenCalled()
})
it('blocks invalid quantities and permits reprinting without a stock receipt', async () => {
  show(); await screen.findByText('FIN123ABC')
  for (const quantity of ['0', '-1', '1.5', '100001']) {
    amount(quantity); expect((confirm() as HTMLButtonElement).disabled).toBe(true)
  }
  amount(''); fireEvent.click(screen.getByRole('button', { name: 'Preparar etiquetas' }))
  await waitFor(() => expect((screen.getByRole('button', { name: 'Imprimir etiquetas' }) as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(screen.getByRole('button', { name: 'Imprimir etiquetas' }))
  expect(mocks.receipt).not.toHaveBeenCalled()
})
it('respects existing seller permissions on barcode creation while allowing stock entry', async () => {
  localStorage.setItem('user', JSON.stringify({ _id: 'seller', role: 'SELLER' }))
  show(); await screen.findByText('FIN123ABC')
  expect(screen.queryByRole('button', { name: 'Generar código interno' })).toBeNull()
  amount('3'); expect((confirm() as HTMLButtonElement).disabled).toBe(false)
})
