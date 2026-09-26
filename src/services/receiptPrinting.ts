import { getReceiptHtml } from './checkout'
import { printTicketDocument } from './printerService'
export async function printThermal(saleId: string) {
  const html = await getReceiptHtml(saleId, 'thermal')
  await printTicketDocument(html, `Venta ${saleId}`)
}
export async function previewReceipt(saleId: string, format: 'thermal' | 'a4') {
  const popup = window.open('', '_blank')
  if (!popup) throw new Error('Permití abrir una ventana para ver e imprimir el comprobante.')
  popup.opener = null
  popup.document.write('<p>Cargando comprobante…</p>')
  try {
    const html = await getReceiptHtml(saleId, format)
    popup.document.open(); popup.document.write(html); popup.document.close()
    const button = popup.document.createElement('button')
    button.textContent = 'Imprimir / Guardar PDF'
    button.style.cssText = 'display:block;margin:12px auto;padding:10px;cursor:pointer'
    button.onclick = () => popup.print()
    const style = popup.document.createElement('style'); style.textContent = '@media print{button{display:none!important}}'
    popup.document.head.append(style); popup.document.body.prepend(button)
  } catch (error) { popup.close(); throw error }
}
