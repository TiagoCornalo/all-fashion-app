import { forwardRef } from 'react'
import { Quote, CompanyInfo } from '../../types/quote.types'
import { formatCurrency, formatDate } from '../../utils'
import logoImage from '../../assets/logo.png'

interface QuoteTemplateProps {
  quote: Quote
  companyInfo: CompanyInfo
  forPdf?: boolean
}

/**
 * Template del remito para impresión y descarga
 * Utiliza la imagen del logo como fondo con opacidad
 */
const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ quote, companyInfo, forPdf = false }, ref) => {
    const typeLabels = {
      'QUOTE': 'PRESUPUESTO',
      'ESTIMATE': 'COTIZACIÓN',
      'INVOICE': 'FACTURA'
    }

    const backgroundStyle = {
      backgroundImage: `url(${logoImage})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: forPdf ? '500px 500px' : '600px 600px',
      backgroundAttachment: forPdf ? 'scroll' : 'fixed'
    }

    // Estilos específicos para PDF (A4)
    const containerStyles = forPdf ? {
      width: '210mm',      // Ancho A4
      minHeight: '297mm',  // Alto A4
      maxWidth: '210mm',
      margin: '0 auto',
      fontSize: '12px',
      lineHeight: '1.4',
      transform: 'scale(1)',
      transformOrigin: 'top left'
    } : {}

    return (
      <div
        ref={ref}
        className="bg-white relative overflow-hidden"
        style={{
          ...backgroundStyle,
          ...containerStyles,
          ...(forPdf ? { minHeight: '297mm' } : { minHeight: '100vh' })
        }}
      >
        {/* Overlay para dar opacidad al fondo */}
        <div className="absolute inset-0 bg-white bg-opacity-90 z-0"></div>

        {/* Contenido principal */}
        <div
          className="relative z-10 max-w-4xl mx-auto"
          style={{
            padding: forPdf ? '20mm' : '2rem',
            ...(forPdf && {
              maxWidth: 'none',
              width: '100%'
            })
          }}
        >
          {/* Header */}
          <div
            className={`flex justify-between items-start ${forPdf ? 'mb-6' : 'mb-8'}`}
            style={forPdf ? { marginBottom: '15mm' } : {}}
          >
            <div className="flex-1">
              <h1
                className={`font-bold text-gray-800 ${forPdf ? 'text-2xl mb-2' : 'text-3xl mb-2'}`}
                style={forPdf ? { fontSize: '18pt', marginBottom: '5mm' } : {}}
              >
                {companyInfo.name}
              </h1>
              <div
                className="text-gray-600 space-y-1"
                style={forPdf ? { fontSize: '10pt', lineHeight: '1.3' } : {}}
              >
                <p>{companyInfo.address}</p>
                <p>Tel: {companyInfo.phone}</p>
                <p>Email: {companyInfo.email}</p>
                {companyInfo.website && <p>Web: {companyInfo.website}</p>}
                {companyInfo.taxId && <p>CUIT: {companyInfo.taxId}</p>}
              </div>
            </div>

            <div className="text-right">
              <h2
                className={`font-bold text-blue-600 ${forPdf ? 'text-xl mb-2' : 'text-2xl mb-2'}`}
                style={forPdf ? { fontSize: '16pt', marginBottom: '3mm' } : {}}
              >
                {typeLabels[quote.type]}
              </h2>
              <div
                className="bg-gray-100 p-4 rounded-lg"
                style={forPdf ? { padding: '8pt', fontSize: '10pt' } : {}}
              >
                <p className="font-semibold">N° {quote.number}</p>
                <p className={`${forPdf ? 'text-xs' : 'text-sm'} text-gray-600`}>
                  Fecha: {formatDate(quote.createdAt)}
                </p>
                {quote.validUntil && (
                  <p className={`${forPdf ? 'text-xs' : 'text-sm'} text-gray-600`}>
                    Válido hasta: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div
            className={forPdf ? 'mb-6' : 'mb-8'}
            style={forPdf ? { marginBottom: '10mm' } : {}}
          >
            <h3
              className={`${forPdf ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1`}
              style={forPdf ? { fontSize: '12pt', marginBottom: '5mm', paddingBottom: '2mm' } : {}}
            >
              DATOS DEL CLIENTE
            </h3>
            <div
              className="bg-gray-50 p-4 rounded-lg"
              style={forPdf ? { padding: '8pt', fontSize: '10pt' } : {}}
            >
              <div className={`grid ${forPdf ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                <div>
                  <p className="font-semibold text-gray-800">{quote.customer.name}</p>
                  {quote.customer.documentType && quote.customer.documentNumber && (
                    <p className="text-gray-600">
                      {quote.customer.documentType}: {quote.customer.documentNumber}
                    </p>
                  )}
                  {quote.customer.phone && (
                    <p className="text-gray-600">Tel: {quote.customer.phone}</p>
                  )}
                  {quote.customer.email && (
                    <p className="text-gray-600">Email: {quote.customer.email}</p>
                  )}
                </div>
                <div>
                  {quote.customer.address && (
                    <>
                      <p className="text-gray-600">{quote.customer.address}</p>
                      {quote.customer.city && (
                        <p className="text-gray-600">
                          {quote.customer.city}
                          {quote.customer.state && `, ${quote.customer.state}`}
                          {quote.customer.postalCode && ` (${quote.customer.postalCode})`}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div
            className={forPdf ? 'mb-6' : 'mb-8'}
            style={forPdf ? { marginBottom: '10mm' } : {}}
          >
            <h3
              className={`${forPdf ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1`}
              style={forPdf ? { fontSize: '12pt', marginBottom: '5mm', paddingBottom: '2mm' } : {}}
            >
              PRODUCTOS / SERVICIOS
            </h3>
            <div className="overflow-hidden border border-gray-300 rounded-lg">
              <table
                className="w-full"
                style={forPdf ? { fontSize: '9pt', borderCollapse: 'collapse' } : {}}
              >
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      className="text-left p-3 font-semibold text-gray-800"
                      style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                    >
                      Código
                    </th>
                    <th
                      className="text-left p-3 font-semibold text-gray-800"
                      style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                    >
                      Descripción
                    </th>
                    <th
                      className="text-center p-3 font-semibold text-gray-800"
                      style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                    >
                      Cant.
                    </th>
                    <th
                      className="text-right p-3 font-semibold text-gray-800"
                      style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                    >
                      Precio Unit.
                    </th>
                    <th
                      className="text-right p-3 font-semibold text-gray-800"
                      style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                    >
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td
                        className="p-3 text-gray-800 font-mono text-sm"
                        style={forPdf ? { padding: '6pt', fontSize: '8pt' } : {}}
                      >
                        {item.productCode}
                      </td>
                      <td
                        className="p-3 text-gray-800"
                        style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                      >
                        <div className="font-medium">{item.productName}</div>
                        {item.description && (
                          <div
                            className={`${forPdf ? 'text-xs' : 'text-sm'} text-gray-600 mt-1`}
                            style={forPdf ? { fontSize: '8pt', marginTop: '2pt' } : {}}
                          >
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td
                        className="p-3 text-center text-gray-800"
                        style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                      >
                        {item.quantity}
                      </td>
                      <td
                        className="p-3 text-right text-gray-800"
                        style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                      >
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td
                        className="p-3 text-right text-gray-800 font-medium"
                        style={forPdf ? { padding: '6pt', fontSize: '9pt' } : {}}
                      >
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div
            className={forPdf ? 'mb-6' : 'mb-8'}
            style={forPdf ? { marginBottom: '10mm' } : {}}
          >
            <div className="flex justify-end">
              <div className={forPdf ? 'w-64' : 'w-full max-w-sm'}>
                <div
                  className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2"
                  style={forPdf ? { padding: '8pt', fontSize: '10pt', lineHeight: '1.3' } : {}}
                >
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>

                  {quote.discount && (
                    <div className="flex justify-between text-red-600">
                      <span>
                        Descuento ({quote.discount.type === 'percentage' ? `${quote.discount.value}%` : 'Fijo'}):
                      </span>
                      <span>
                        -{formatCurrency(
                          quote.discount.type === 'percentage'
                            ? (quote.subtotal * quote.discount.value) / 100
                            : quote.discount.value
                        )}
                      </span>
                    </div>
                  )}

                  {quote.tax > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Impuestos:</span>
                      <span>{formatCurrency(quote.tax)}</span>
                    </div>
                  )}

                  <hr className="border-gray-300" />

                  <div
                    className={`flex justify-between ${forPdf ? 'text-base' : 'text-lg'} font-bold text-gray-800`}
                    style={forPdf ? { fontSize: '12pt' } : {}}
                  >
                    <span>TOTAL:</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          {quote.notes && (
            <div
              className={forPdf ? 'mb-6' : 'mb-8'}
              style={forPdf ? { marginBottom: '8mm' } : {}}
            >
              <h3
                className={`${forPdf ? 'text-base' : 'text-lg'} font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1`}
                style={forPdf ? { fontSize: '12pt', marginBottom: '5mm', paddingBottom: '2mm' } : {}}
              >
                OBSERVACIONES
              </h3>
              <div
                className="bg-gray-50 p-4 rounded-lg"
                style={forPdf ? { padding: '8pt', fontSize: '10pt' } : {}}
              >
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Condiciones generales */}
          <div
            className="mt-8 pt-6 border-t border-gray-300"
            style={forPdf ? { marginTop: '8mm', paddingTop: '5mm' } : {}}
          >
            <div
              className={`${forPdf ? 'text-xs' : 'text-sm'} text-gray-600 space-y-2`}
              style={forPdf ? { fontSize: '8pt', lineHeight: '1.3' } : {}}
            >
              <p className="font-semibold">CONDICIONES GENERALES:</p>
              <p>• Los precios están expresados en pesos argentinos.</p>
              <p>• Esta cotización tiene una validez limitada según se indica.</p>
              <p>• Los precios pueden estar sujetos a cambios sin previo aviso.</p>
              <p>• Para confirmar el pedido, contactarse a los datos de contacto indicados.</p>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`mt-8 text-center ${forPdf ? 'text-xs' : 'text-sm'} text-gray-500`}
            style={forPdf ? { marginTop: '8mm', fontSize: '8pt' } : {}}
          >
            <p>Documento generado automáticamente - {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>
    )
  }
)

QuoteTemplate.displayName = 'QuoteTemplate'

export default QuoteTemplate