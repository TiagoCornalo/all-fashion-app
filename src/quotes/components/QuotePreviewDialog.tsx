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
    if (!quote || !quoteRef.current || !companyInfo) {
      toast.error('No se puede generar el PDF en este momento')
      return
    }

    setIsGeneratingPDF(true)

    try {
      // Configurar el elemento para captura
      const element = quoteRef.current

      // Configurar html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Mayor resolución
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth
      })

      // Configurar PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Calcular dimensiones para ajustar al A4
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      // Agregar imagen al PDF
      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      )

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
            />
          </div>
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