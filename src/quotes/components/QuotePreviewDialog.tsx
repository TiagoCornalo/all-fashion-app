import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button
} from '../../components'
import { Quote } from '../../types/quote.types'
import { Download, Printer, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import { useReactToPrint } from 'react-to-print'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import QuoteTemplate from './QuoteTemplate'
import { getCompanyInfo } from '../../services/quote.service'
import { useQuery } from '@tanstack/react-query'

interface QuotePreviewDialogProps {
  quote: Quote | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Modal para previsualizar y descargar remitos
 */
const QuotePreviewDialog = ({ quote, isOpen, onOpenChange }: QuotePreviewDialogProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const quoteRef = useRef<HTMLDivElement>(null)
  const quotePdfRef = useRef<HTMLDivElement>(null) // Ref separada para PDF

  // Obtener información de la empresa
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info'],
    queryFn: getCompanyInfo,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  // Configurar react-to-print para imprimir
  const handlePrint = useReactToPrint({
    contentRef: quoteRef,
    documentTitle: `Remito_${quote?.number || 'unknown'}_${new Date().toISOString().split('T')[0]}`,
    onPrintError: (error) => {
      console.error('Error al imprimir:', error)
      toast.error('Error al imprimir el documento')
    }
  })

  /**
   * Generar y descargar PDF usando html2canvas y jsPDF
   */
  const handleDownloadPDF = async () => {
    if (!quote || !quotePdfRef.current || !companyInfo) {
      toast.error('No se puede generar el PDF en este momento')
      return
    }

    setIsGeneratingPDF(true)

    try {
      // Configurar el elemento para captura (usar la ref específica para PDF)
      const element = quotePdfRef.current

      // Configurar html2canvas con mejor resolución para A4
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 794, // Ancho A4 en pixels (210mm a 96 DPI)
        windowHeight: 1123 // Alto A4 en pixels (297mm a 96 DPI)
      })

      // Configurar PDF en formato A4
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

      // Convertir canvas a imagen y agregar al PDF
      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)

      // Descargar el PDF
      const fileName = `Remito_${quote.number}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

      toast.success('PDF descargado correctamente')
    } catch (error) {
      console.error('Error al generar PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!quote || !companyInfo) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='w-[95vw] max-w-6xl max-h-[95vh] overflow-hidden flex flex-col'>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Eye className='h-4 w-4 sm:h-5 sm:w-5' />
            Vista Previa - {quote.type === 'QUOTE' ? 'Presupuesto' : quote.type === 'ESTIMATE' ? 'Cotización' : 'Factura'} N° {quote.number}
          </DialogTitle>
        </DialogHeader>

        {/* Vista previa del documento */}
        <div className="flex-1 overflow-auto bg-gray-100 p-2 sm:p-4">
          <div className="max-w-4xl mx-auto">
            <QuoteTemplate
              ref={quoteRef}
              quote={quote}
              companyInfo={companyInfo}
              forPdf={false} // Vista previa normal
            />
          </div>
        </div>

        {/* Template oculto para generar PDF en formato A4 */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <QuoteTemplate
            ref={quotePdfRef}
            quote={quote}
            companyInfo={companyInfo}
            forPdf={true} // Formato A4 para PDF
          />
        </div>

        {/* Botones de acción */}
        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-3 sm:order-1 text-xs sm:text-sm"
          >
            Cerrar
          </Button>

          <Button
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto order-2 sm:order-2 text-xs sm:text-sm"
          >
            <Printer className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
            Imprimir
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="w-full sm:w-auto order-1 sm:order-3 text-xs sm:text-sm"
          >
            <Download className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
            {isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default QuotePreviewDialog