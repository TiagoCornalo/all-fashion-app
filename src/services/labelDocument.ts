import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import { PreparedProductLabel } from '../types/barcode.types'
const LABEL_WIDTH_MM = 50
const LABEL_HEIGHT_MM = 30
const SAFE_HORIZONTAL_MARGIN_MM = 3
const MAX_BARCODE_WIDTH_MM = 44
const CONTENT_OFFSET_X_MM = 0.5
const MM_PER_POINT = 25.4 / 72
const QUIET_ZONE_MODULES = 10
const THERMAL_MODULE_WIDTH_MM = 2 / 8 // Two dots on an 8 dots/mm thermal printer.

const newLabelDocument = () => new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
  compress: true,
  precision: 16
})

// Shared physical layout for the PDF and the on-screen preview. Barcode height
// must not depend on the aspect ratio of a raster image (or on code length).
export function getLabelLayout(label: PreparedProductLabel, includePrice: boolean, pdf = newLabelDocument()) {
  const centerX = LABEL_WIDTH_MM / 2 + CONTENT_OFFSET_X_MM
  const contentWidth = LABEL_WIDTH_MM - SAFE_HORIZONTAL_MARGIN_MM * 2
  pdf.setFont('helvetica', 'bold')
  let nameFontSize = 7.5
  pdf.setFontSize(nameFontSize)
  let nameLines: string[] = pdf.splitTextToSize(label.product.name, contentWidth)
  while (nameLines.length > 2 && nameFontSize > 5.5) {
    nameFontSize -= 0.5
    pdf.setFontSize(nameFontSize)
    nameLines = pdf.splitTextToSize(label.product.name, contentWidth)
  }
  nameLines = nameLines.slice(0, 2)
  const nameLineHeight = nameFontSize * MM_PER_POINT * 1.05
  const codeY = 2.8 + (nameLines.length - 1) * nameLineHeight + 2.6

  const encoded: { encodings?: { data: string }[] } = {}
  // JsBarcode supports an object renderer; @types/jsbarcode only declares DOM targets.
  JsBarcode(encoded as unknown as SVGElement, label.barcode.value, { format: 'CODE128', displayValue: false })
  const modules = encoded.encodings?.map(encoding => encoding.data).join('') || ''
  if (!/^[01]+$/.test(modules)) throw new Error('No se pudo generar el código de barras.')
  // Reserve at least 10 modules of white space on either side, including for
  // short codes whose bars would otherwise become too wide for the quiet zones.
  const availableWidth = 2 * Math.min(centerX, LABEL_WIDTH_MM - centerX)
  const compactInternal = label.barcode.origin === 'INTERNAL' && /^29\d{10}$/.test(label.barcode.value)
  const moduleWidth = compactInternal
    ? THERMAL_MODULE_WIDTH_MM
    : Math.min(MAX_BARCODE_WIDTH_MM / modules.length, availableWidth / (modules.length + QUIET_ZONE_MODULES * 2))
  const barcodeWidth = modules.length * moduleWidth
  const barcodeX = centerX - barcodeWidth / 2
  const barcodeY = codeY + 1.2
  const barcodeBottom = includePrice ? 22 : 25
  const bars = Array.from(modules.matchAll(/1+/g), match => ({
    x: barcodeX + match.index! * moduleWidth,
    width: match[0].length * moduleWidth
  }))
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  const barcodeTextSize = Math.min(6.5, 6.5 * contentWidth / pdf.getTextWidth(label.barcode.value))

  return {
    width: LABEL_WIDTH_MM, height: LABEL_HEIGHT_MM, centerX,
    nameLines, nameFontSize, nameLineHeight, nameY: 2.8, codeY,
    bars, barcodeX, barcodeWidth, moduleWidth, barcodeY,
    barcodeHeight: barcodeBottom - barcodeY,
    barcodeTextY: barcodeBottom + 2.5, barcodeTextSize,
    priceY: LABEL_HEIGHT_MM - 2.2
  }
}

export const formatArs = (value: number) =>
  Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

export const getFinalLabelPrice = (label: PreparedProductLabel) => {
  const explicitFinalPrice = Number(label.finalPriceArs)
  return Number.isFinite(explicitFinalPrice)
    ? explicitFinalPrice
    : Number(label.product.price || 0)
}


export function validateLabelBatch(labels: PreparedProductLabel[], copies: Record<string, number>) {
  if (!labels.length) throw new Error('Agregá productos al lote.')
  let total = 0
  for (const label of labels) {
    const count = copies[label.product._id]
    if (!Number.isInteger(count) || count < 1 || count > 999) throw new Error('Las copias deben ser enteras entre 1 y 999.')
    if (label.barcode.unitsPerScan !== 1) throw new Error('El código representa varias unidades. Usá un código unitario para etiquetar productos.')
    if (!/^[\x20-\x7e]{3,40}$/.test(label.barcode.value)) throw new Error('Código incompatible con la etiqueta. Elegí Siempre código interno.')
    total += count
  }
  if (total > 1000) throw new Error('El lote admite hasta 1000 etiquetas. Dividilo en varios lotes.')
  return total
}
export function createLabelPdf(labels: PreparedProductLabel[], copies: Record<string, number>, includePrice: boolean) {
  validateLabelBatch(labels, copies)
  const pdf = newLabelDocument()
  pdf.setProperties({ title: 'Etiquetas 50x30 mm' })
  let page = 0
  for (const label of labels) {
    const layout = getLabelLayout(label, includePrice, pdf)
    for (let copy = 0; copy < copies[label.product._id]; copy++) {
      if (page++ > 0) pdf.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], 'landscape')
      pdf.setTextColor(0, 0, 0)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(layout.nameFontSize)
      layout.nameLines.forEach((line, index) => {
        pdf.text(line, layout.centerX, layout.nameY + index * layout.nameLineHeight, { align: 'center' })
      })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(5.5)
      pdf.text(`Código ${label.product.code}`, layout.centerX, layout.codeY, { align: 'center' })

      // Fill the bars as one compound path. PDFium rounds individually filled
      // rectangles differently at thermal resolutions, distorting narrow spaces.
      pdf.setFillColor(0, 0, 0)
      for (const bar of layout.bars) {
        pdf.rect(bar.x, layout.barcodeY, bar.width, layout.barcodeHeight, null)
      }
      pdf.fill()
      pdf.setFontSize(layout.barcodeTextSize)
      pdf.text(label.barcode.value, layout.centerX, layout.barcodeTextY, { align: 'center' })
      if (includePrice) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(8)
        pdf.text(formatArs(getFinalLabelPrice(label)), layout.centerX, layout.priceY, { align: 'center' })
      }
    }
  }
  return pdf
}
