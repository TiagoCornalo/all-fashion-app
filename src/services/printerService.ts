import api from './config/axios'
let connection: Promise<typeof import('qz-tray')> | null = null
async function connect(): Promise<typeof import('qz-tray')> {
  if (!connection) connection = (async () => {
    const qz = (await import('qz-tray')).default
    const { data } = await api.get('/printing/config')
    if (data.signed) {
      const messages = new Map<string, string>()
      const hashMessage = async (message: string) => {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
        const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
        messages.set(hash, message)
        return hash
      }
      // @types/qz-tray describes a callback here; QZ 2.2 accepts a string and a promise.
      qz.api.setSha256Type(hashMessage as unknown as Parameters<typeof qz.api.setSha256Type>[0])
      qz.security.setCertificatePromise((resolve, reject) => { api.get('/printing/certificate', { responseType: 'text' }).then(r => resolve(r.data)).catch(reject) }, { rejectOnFailure: true })
      qz.security.setSignatureAlgorithm('SHA512')
      qz.security.setSignaturePromise(toSign => (resolve, reject) => { const message = messages.get(toSign); messages.delete(toSign); api.post('/printing/sign', { toSign: message }).then(r => resolve(r.data.signature)).catch(reject) })
    }
    if (!qz.websocket.isActive()) await qz.websocket.connect({ retries: 0 })
    return qz
  })().catch(error => { connection = null; throw error })
  const qz = await connection
  if (!qz.websocket.isActive()) {
    connection = null
    // Reconnect once; a connection that drops again is reported to the user.
    await qz.websocket.connect({ retries: 0 })
    if (!qz.websocket.isActive()) throw new Error('QZ Tray se desconectó. Revisá la aplicación y volvé a intentar.')
  }
  return qz
}
export async function listPrinters(): Promise<string[]> {
  const printers = await (await connect()).printers.find()
  return (Array.isArray(printers) ? printers : [printers]).filter(name => typeof name === 'string' && name.length > 0)
}

export const PRINTERS_CHANGED = 'allfashion:printers-changed'
export function getPrinter(): string {
  try { return localStorage.getItem('receipt-printer') || '' } catch { return '' }
}
export function savePrinter(name: string) {
  localStorage.setItem('receipt-printer', name)
  window.dispatchEvent(new Event(PRINTERS_CHANGED))
}
export async function printTicketDocument(data: string, jobName: string) {
  if (new TextEncoder().encode(data).length > 6 * 1024 * 1024) throw new Error('El comprobante es demasiado grande. Usá la vista de impresión.')
  const printer = getPrinter()
  if (!printer) throw new Error('La impresión de tickets todavía no está configurada. Avisá al administrador.')
  const qz = await connect()
  const available = await qz.printers.find()
  if (!(Array.isArray(available) ? available : [available]).includes(printer)) throw new Error('La impresora de tickets no está disponible.')
  // Always use the saved ticket queue, even when the OS defaults to labels.
  const config = qz.configs.create(printer, { jobName, units: 'mm', margins: 0, copies: 1, scaleContent: false })
  await qz.print(config, [{ type: 'pixel', format: 'html', flavor: 'plain', data, options: { pageWidth: 80 } }])
}
