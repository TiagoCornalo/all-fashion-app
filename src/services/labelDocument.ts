import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { PreparedProductLabel } from '../types/barcode.types'
const LABEL_WIDTH_MM = 50
const LABEL_HEIGHT_MM = 30
const SAFE_HORIZONTAL_MARGIN_MM = 3
const MAX_BARCODE_WIDTH_MM = 42.5
const CONTENT_OFFSET_X_MM = 0.5

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
  const printLabels = labels.flatMap((label) => {
    const { product, barcode } = label
    const amount = copies[product._id]
    const finalPriceArs = getFinalLabelPrice(label)
    return Array.from({ length: amount }, () => ({
      product,
      barcode,
      finalPriceArs
    }))
  })

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM],
    compress: true,
    precision: 16
  })
  pdf.setProperties({ title: 'Etiquetas 50x30 mm' })

  printLabels.forEach(({ product, barcode, finalPriceArs }, index) => {
    if (index > 0) {
      pdf.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM], 'landscape')
    }

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const centerX = pageWidth / 2 + CONTENT_OFFSET_X_MM
    const contentWidth = pageWidth - SAFE_HORIZONTAL_MARGIN_MM * 2

    pdf.setTextColor(0, 0, 0)
    pdf.setFont('helvetica', 'bold')
    let productNameFontSize = 7.5
    pdf.setFontSize(productNameFontSize)
    let productNameLines = pdf.splitTextToSize(product.name, contentWidth)
    while (productNameLines.length > 2 && productNameFontSize > 5.5) {
      productNameFontSize -= 0.5
      pdf.setFontSize(productNameFontSize)
      productNameLines = pdf.splitTextToSize(product.name, contentWidth)
    }
    productNameLines = productNameLines.slice(0, 2)
    pdf.text(productNameLines, centerX, 2.8, {
      align: 'center',
      lineHeightFactor: 1.05,
      maxWidth: contentWidth
    })

    const nameLineHeight = productNameFontSize * 0.3528 * 1.05
    const codeY = 2.8 + (productNameLines.length - 1) * nameLineHeight + 2.6
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(5.5)
    pdf.text(`Código ${product.code}`, centerX, codeY, { align: 'center' })

    const barcodeCanvas = document.createElement('canvas')
    JsBarcode(barcodeCanvas, barcode.value, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 48,
      margin: 12,
      fontSize: 12,
      background: '#ffffff',
      lineColor: '#000000'
    })

    const barcodeTop = codeY + 1
    const barcodeBottom = includePrice ? pageHeight - 5.8 : pageHeight - 2.5
    const maxBarcodeWidth = Math.min(contentWidth, MAX_BARCODE_WIDTH_MM)
    const maxBarcodeHeight = barcodeBottom - barcodeTop
    const barcodeRatio = barcodeCanvas.width / barcodeCanvas.height
    let barcodeWidth = maxBarcodeWidth
    let barcodeHeight = barcodeWidth / barcodeRatio
    if (barcodeHeight > maxBarcodeHeight) {
      barcodeHeight = maxBarcodeHeight
      barcodeWidth = barcodeHeight * barcodeRatio
    }
    pdf.addImage(
      barcodeCanvas.toDataURL('image/png'),
      'PNG',
      centerX - barcodeWidth / 2,
      barcodeTop,
      barcodeWidth,
      barcodeHeight,
      undefined,
      'FAST'
    )

    if (includePrice) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.text(formatArs(finalPriceArs), centerX, pageHeight - 2.2, {
        align: 'center'
      })
    }
  })

  return pdf
}
