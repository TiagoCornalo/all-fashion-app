import { beforeEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ find: vi.fn(), print: vi.fn(), create: vi.fn((name, options) => ({ name, options })), active: vi.fn(() => true), connect: vi.fn(), getDefault: vi.fn() }))
vi.mock('qz-tray', () => ({ default: { printers: { find: mock.find, getDefault: mock.getDefault }, print: mock.print, configs: { create: mock.create }, websocket: { isActive: mock.active, connect: mock.connect } } }))
vi.mock('./config/axios', () => ({ default: { get: vi.fn(async () => ({ data: { signed: false } })) } }))
import { getPrinter, printTicketDocument, savePrinter } from './printerService'
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); mock.find.mockResolvedValue(['Epson TM-T20', 'Zebra etiquetas']); mock.print.mockResolvedValue(undefined) })
describe('ticket printing', () => {
  it('uses the ticket queue without querying or changing the OS label default', async () => {
    savePrinter('Epson TM-T20')
    await printTicketDocument('<p>Ticket</p>', 'Venta')
    expect(mock.print.mock.calls[0][0].name).toBe('Epson TM-T20')
    expect(mock.print.mock.calls[0][0].options).toMatchObject({ copies: 1, scaleContent: false })
    expect(mock.getDefault).not.toHaveBeenCalled()
  })
  it('does not fall back when the saved queue is removed or renamed', async () => {
    savePrinter('Desconectada')
    await expect(printTicketDocument('', 'Venta')).rejects.toThrow('no está disponible')
    expect(mock.print).not.toHaveBeenCalled()
  })
  it('requires ticket setup and ignores obsolete label settings', async () => {
    await expect(printTicketDocument('', 'Venta')).rejects.toThrow('no está configurada')
    localStorage.setItem('label-printer', 'Epson TM-T20')
    savePrinter('Epson TM-T20')
    expect(getPrinter()).toBe('Epson TM-T20')
    await printTicketDocument('', 'Venta')
    expect(mock.print).toHaveBeenCalledTimes(1)
  })
  it('propagates print errors without retrying a possible duplicate', async () => {
    savePrinter('Epson TM-T20'); mock.print.mockRejectedValueOnce(new Error('Disconnected'))
    await expect(printTicketDocument('', 'Venta')).rejects.toThrow('Disconnected')
    expect(mock.print).toHaveBeenCalledTimes(1)
  })
})
