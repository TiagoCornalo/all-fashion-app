import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label
} from '../../components'
import { FileText, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { createQuote } from '../../services/quote.service'
import { QuoteTemplate } from '../../quotes/components'
import { useQuery } from '@tanstack/react-query'
import { getCompanyInfo } from '../../services/quote.service'
import { Quote, CreateQuoteDto, QuoteItem } from '../../types/quote.types'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useRef } from 'react'

interface SaleToQuoteProps {
  saleId: string
  saleTotal: number
  saleItems: Array<{
    product: {
      _id: string
      name: string
      code?: string
    }
    quantity: number
    price?: number
    subtotal?: number
  }>
  customer?: {
    name?: string
    phone?: string
    email?: string
  }
  invoice?: {
    number?: string
    type?: string
    customer?: {
      documentType?: 'DNI' | 'CUIT'
      documentNumber?: string
      name?: string
      address?: string
      phone?: string
      email?: string
    }
  }
}

/**
 * Componente para generar remitos/presupuestos desde ventas existentes
 */
export const SaleToQuote = ({
  saleId,
  saleTotal,
  saleItems,
  customer,
  invoice
}: SaleToQuoteProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState<'QUOTE' | 'ESTIMATE' | 'INVOICE'>('QUOTE')
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const quoteRef = useRef<HTMLDivElement>(null)
  const quotePdfRef = useRef<HTMLDivElement>(null)

  // Obtener información de la empresa
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Configurar react-to-print para imprimir
  const handlePrint = useReactToPrint({
    contentRef: quoteRef,
    documentTitle: `Remito_${generatedQuote?.number || 'unknown'}_${new Date().toISOString().split('T')[0]}`,
    onPrintError: (error) => {
      console.error('Error al imprimir:', error)
      toast.error('Error al imprimir el documento')
    }
  })

  const handleGenerateQuote = async () => {
    setIsGenerating(true)

    try {
      // Preparar datos del cliente según estructura del backend
      const customerData = {
        name: invoice?.customer?.name || customer?.name || 'Cliente',
        phone: invoice?.customer?.phone || customer?.phone,
        email: invoice?.customer?.email || customer?.email,
        documentType: invoice?.customer?.documentType || 'DNI',
        documentNumber: invoice?.customer?.documentNumber || '',
        address: invoice?.customer?.address || ''
      }

      // Preparar items del remito. Si el producto fue eliminado de la DB
      // (item.product === null), igual armamos el item con los datos
      // snapshot guardados en la venta para no romper la conversión.
      const items: QuoteItem[] = saleItems.map((item) => {
        const product = (item.product as any) || {}
        return {
          productId: product._id || '',
          productCode: product.code || '',
          productName: product.name || 'Producto eliminado',
          quantity: item.quantity,
          unitPrice: item.price || 0,
          subtotal: item.subtotal || (item.quantity * (item.price || 0))
        }
      })

      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)

      const newQuoteData: CreateQuoteDto = {
        type: selectedType,
        customer: customerData, // El servicio convertirá esto a customerData para el backend
        items,
        tax: 0,
        notes: `Generado desde venta ID: ${saleId}${invoice?.number ? ` - Factura: ${invoice.type} ${invoice.number}` : ''}`
      }

      const quote = await createQuote(newQuoteData)

      // Crear quote completo para preview
      const completeQuote: Quote = {
        ...quote,
        _id: quote._id || '',
        number: quote.number || '',
        subtotal,
        total: subtotal,
        createdBy: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      setGeneratedQuote(completeQuote)
      setIsDialogOpen(false)
      setIsPreviewOpen(true)
      toast.success('Remito generado correctamente')
    } catch (error) {
      console.error('Error al generar remito:', error)
      toast.error('Error al generar el remito')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generar y descargar PDF
   */
  const handleDownloadPDF = async () => {
    if (!generatedQuote || !quotePdfRef.current || !companyInfo) {
      toast.error('No se puede generar el PDF en este momento')
      return
    }

    try {
      const element = quotePdfRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 794, // Ancho A4 en pixels
        windowHeight: 1123 // Alto A4 en pixels
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Dimensiones A4 en mm
      const pdfWidth = 210
      const pdfHeight = 297

      // Calcular dimensiones para que se ajuste a A4
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583))

      const finalWidth = imgWidth * 0.264583 * ratio
      const finalHeight = imgHeight * 0.264583 * ratio

      // Centrar en la página
      const x = (pdfWidth - finalWidth) / 2
      const y = 0

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)

      const fileName = `Remito_${generatedQuote.number}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      'QUOTE': 'Presupuesto',
      'ESTIMATE': 'Cotización',
      'INVOICE': 'Factura'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Generar Remito/Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Generar un remito o presupuesto basado en esta venta para enviar al cliente
          </p>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full text-xs sm:text-sm"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Generar Remito
          </Button>
        </CardContent>
      </Card>

      {/* Dialog para seleccionar tipo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Generar Remito/Presupuesto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Tipo de Documento</Label>
              <Select value={selectedType} onValueChange={(value: 'QUOTE' | 'ESTIMATE' | 'INVOICE') => setSelectedType(value)}>
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUOTE">Presupuesto</SelectItem>
                  <SelectItem value="ESTIMATE">Cotización</SelectItem>
                  <SelectItem value="INVOICE">Factura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm">
              <h4 className="font-medium mb-2">Información de la venta:</h4>
              <p><strong>Total:</strong> ${saleTotal.toLocaleString()}</p>
              <p><strong>Productos:</strong> {saleItems.length}</p>
              {customer?.name && <p><strong>Cliente:</strong> {customer.name}</p>}
              {invoice?.number && <p><strong>Factura:</strong> {invoice.type} {invoice.number}</p>}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateQuote}
              disabled={isGenerating}
              className="w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm"
            >
              {isGenerating ? 'Generando...' : `Generar ${getTypeLabel(selectedType)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview */}
      {generatedQuote && companyInfo && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className='w-[95vw] max-w-6xl max-h-[95vh] overflow-hidden flex flex-col'>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-base sm:text-lg">
                {getTypeLabel(generatedQuote.type)} N° {generatedQuote.number} - Generado
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4">
              <div className="max-w-4xl mx-auto">
                <QuoteTemplate
                  ref={quoteRef}
                  quote={generatedQuote}
                  companyInfo={companyInfo}
                  forPdf={false}
                />
              </div>
            </div>

            {/* Template oculto para generar PDF en formato A4 */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              <QuoteTemplate
                ref={quotePdfRef}
                quote={generatedQuote}
                companyInfo={companyInfo}
                forPdf={true}
              />
            </div>

            <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                className="w-full sm:w-auto order-3 sm:order-1 text-xs sm:text-sm"
              >
                Cerrar
              </Button>

              <Button
                variant="outline"
                onClick={handlePrint}
                className="w-full sm:w-auto order-2 sm:order-2 text-xs sm:text-sm"
              >
                <FileText className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                Imprimir
              </Button>

              <Button
                onClick={handleDownloadPDF}
                className="w-full sm:w-auto order-1 sm:order-3 text-xs sm:text-sm"
              >
                <Download className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
                Descargar PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}