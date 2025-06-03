import { Card, CardContent, CardHeader, CardTitle } from '../../components'
import { File } from 'lucide-react'

/**
 * Contenedor para gestión de templates de servicios técnicos
 */
const TemplatesContainer = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          Templates de Servicios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <File size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Próximamente
          </h3>
          <p className="text-gray-600 max-w-sm mx-auto">
            Los templates de servicios técnicos estarán disponibles pronto.
            Podrás crear plantillas para servicios comunes y acelerar el proceso.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TemplatesContainer