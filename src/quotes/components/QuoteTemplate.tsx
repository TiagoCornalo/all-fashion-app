import { forwardRef } from 'react'
import { Quote, CompanyInfo } from '../../types/quote.types'
import { formatCurrency, formatDate } from '../../utils'
import logoImage from '../../assets/logo.png'

interface QuoteTemplateProps {
  quote: Quote
  companyInfo: CompanyInfo
}

/**
 * Template del remito para impresión y descarga
 * Utiliza la imagen del logo como fondo con opacidad
 */
const QuoteTemplate = forwardRef<HTMLDivElement, QuoteTemplateProps>(
  ({ quote, companyInfo }, ref) => {
    const typeLabels = {
      'QUOTE': 'PRESUPUESTO',
      'ESTIMATE': 'COTIZACIÓN',
      'INVOICE': 'FACTURA'
    }

    const backgroundStyle = {
      backgroundImage: `url(${logoImage})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '600px 600px',
      backgroundAttachment: 'fixed'
    }

    return (
      <div
        ref={ref}
        className="bg-white min-h-screen relative overflow-hidden"
        style={backgroundStyle}
      >
        {/* Overlay para dar opacidad al fondo */}
        <div className="absolute inset-0 bg-white bg-opacity-90 z-0"></div>

        {/* Contenido principal */}
        <div className="relative z-10 p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {companyInfo.name}
              </h1>
              <div className="text-gray-600 space-y-1">
                <p>{companyInfo.address}</p>
                <p>Tel: {companyInfo.phone}</p>
                <p>Email: {companyInfo.email}</p>
                {companyInfo.website && <p>Web: {companyInfo.website}</p>}
                {companyInfo.taxId && <p>CUIT: {companyInfo.taxId}</p>}
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                {typeLabels[quote.type]}
              </h2>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="font-semibold">N° {quote.number}</p>
                <p className="text-sm text-gray-600">
                  Fecha: {formatDate(quote.createdAt)}
                </p>
                {quote.validUntil && (
                  <p className="text-sm text-gray-600">
                    Válido hasta: {formatDate(quote.validUntil)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información del cliente */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              DATOS DEL CLIENTE
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
              PRODUCTOS / SERVICIOS
            </h3>
            <div className="overflow-hidden border border-gray-300 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-800">Código</th>
                    <th className="text-left p-3 font-semibold text-gray-800">Descripción</th>
                    <th className="text-center p-3 font-semibold text-gray-800">Cant.</th>
                    <th className="text-right p-3 font-semibold text-gray-800">Precio Unit.</th>
                    <th className="text-right p-3 font-semibold text-gray-800">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="p-3 text-gray-800 font-mono text-sm">
                        {item.productCode}
                      </td>
                      <td className="p-3 text-gray-800">
                        <div className="font-medium">{item.productName}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        )}
                      </td>
                      <td className="p-3 text-center text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right text-gray-800">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="p-3 text-right text-gray-800 font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="mb-8">
            <div className="flex justify-end">
              <div className="w-full max-w-sm">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2">
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

                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          {quote.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
                OBSERVACIONES
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </div>
          )}

          {/* Condiciones generales */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="text-sm text-gray-600 space-y-2">
              <p className="font-semibold">CONDICIONES GENERALES:</p>
              <p>• Los precios están expresados en pesos argentinos.</p>
              <p>• Esta cotización tiene una validez limitada según se indica.</p>
              <p>• Los precios pueden estar sujetos a cambios sin previo aviso.</p>
              <p>• Para confirmar el pedido, contactarse a los datos de contacto indicados.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Documento generado automáticamente - {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>
    )
  }
)

QuoteTemplate.displayName = 'QuoteTemplate'

export default QuoteTemplate