import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Loader,
  Input,
  Textarea,
  Checkbox
} from '../../../components'
import { Package, AlertTriangle, ArrowLeft, Save } from 'lucide-react'
import { orderVerificationService, VerificationIssue, VerificationData } from '../../../services/orderVerification.service'
import { formatDateTime, extractMongooseData, getErrorMessage, ApiError } from '../../../utils'

/**
 * Formulario para verificar cantidades de un pedido específico
 */
const OrderVerificationForm = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [allCorrect, setAllCorrect] = useState(true)
  const [issues, setIssues] = useState<VerificationIssue[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Query para obtener detalles del pedido
  const { data: orderResponse, isLoading, error } = useQuery({
    queryKey: ['order-for-verification', orderId],
    queryFn: () => orderVerificationService.getOrderForVerification(orderId!),
    enabled: !!orderId
  })

  // Extraer datos limpios del objeto de Mongoose
  const order = orderResponse ? extractMongooseData(orderResponse) : null

  // Mutation para enviar verificación
  const verifyMutation = useMutation({
    mutationFn: (verificationData: VerificationData) =>
      orderVerificationService.employeeVerifyOrder(orderId!, verificationData),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['arrived-orders-pending'] })
      queryClient.invalidateQueries({ queryKey: ['order-for-verification', orderId] })
      navigate('/orders/verification')
    },
    onError: (error: ApiError) => {
      toast.error(getErrorMessage(error))
      setIsSubmitting(false)
    }
  })

  // Inicializar issues cuando cambia allCorrect
  useEffect(() => {
    if (allCorrect) {
      setIssues([])
    } else if (order && issues.length === 0) {
      // Crear issues vacíos para cada producto
      const newIssues: VerificationIssue[] = order.items.map(item => ({
        productId: item.product._id || '',
        expectedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Inicializar con cantidad esperada
        notes: ''
      }))
      setIssues(newIssues)
    }
  }, [allCorrect, order, issues.length])

  const handleIssueChange = (index: number, field: keyof VerificationIssue, value: string | number) => {
    const newIssues = [...issues]
    newIssues[index] = { ...newIssues[index], [field]: value }
    setIssues(newIssues)
  }

  const handleSubmit = () => {
    if (!order) return

    setIsSubmitting(true)

    // Filtrar solo los productos con problemas (cantidad recibida != esperada)
    const actualIssues = allCorrect
      ? []
      : issues.filter(issue => issue.receivedQuantity !== issue.expectedQuantity)

    const verificationData: VerificationData = {
      allCorrect,
      issues: actualIssues,
      notes: notes.trim() || undefined
    }

    verifyMutation.mutate(verificationData)
  }

  const goBack = () => {
    navigate('/orders/verification')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="h-8 w-8" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error al cargar el pedido</p>
            <Button onClick={goBack} variant="outline">
              Volver a la lista
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasExistingVerification = !!order.employeeVerification
  const canVerify = order.userPermissions?.canVerify

  console.log('Order data:', order)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={goBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Verificar Pedido - {order.supplier?.name || 'Proveedor desconocido'}
          </h1>
          <p className="text-gray-600">
            Verifica las cantidades recibidas vs las solicitadas
          </p>
        </div>
      </div>

      {/* Información del pedido */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Información del Pedido
            <Badge variant="outline" className="ml-auto">
              {order.receptionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Proveedor:</p>
              <p className="text-gray-900">{order.supplier?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Llegó el:</p>
              <p className="text-gray-900">{formatDateTime(order.actualArrivalDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Confirmado por:</p>
              <p className="text-gray-900">{order.confirmedArrivalBy?.name || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificación existente */}
      {hasExistingVerification && (
        <Card className="mb-6 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Verificación Existente
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-yellow-50">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Verificado el:</strong> {formatDateTime(order.employeeVerification!.verificationDate)}
              </p>
              <p className="text-sm">
                <strong>Estado:</strong> {order.employeeVerification!.allCorrect ? 'Todo correcto' : 'Problemas reportados'}
              </p>
              {order.employeeVerification!.notes && (
                <p className="text-sm">
                  <strong>Notas:</strong> {order.employeeVerification!.notes}
                </p>
              )}
              {!canVerify && (
                <p className="text-sm text-yellow-700 font-medium">
                  Este pedido ya fue verificado por otro empleado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario de verificación */}
      {canVerify && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verificación de Cantidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Toggle principal */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                checked={allCorrect}
                onCheckedChange={(checked) => setAllCorrect(checked as boolean)}
              />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Todas las cantidades están correctas
                </label>
                <p className="text-xs text-gray-600">
                  Marca esta opción si todos los productos llegaron en las cantidades correctas
                </p>
              </div>
            </div>

            {/* Lista de productos para verificar */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Productos a verificar:</h3>

              {order.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">Código: {item.product.code}</p>
                    </div>
                    <Badge variant="outline">
                      Esperado: {item.quantity}
                    </Badge>
                  </div>

                  {!allCorrect && issues[index] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad recibida
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={issues[index].receivedQuantity}
                          onChange={(e) => handleIssueChange(index, 'receivedQuantity', parseInt(e.target.value) || 0)}
                          placeholder="Cantidad real recibida"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notas (opcional)
                        </label>
                        <Input
                          value={issues[index].notes || ''}
                          onChange={(e) => handleIssueChange(index, 'notes', e.target.value)}
                          placeholder="Observaciones sobre este producto"
                        />
                      </div>
                    </div>
                  )}

                  {!allCorrect && issues[index] && issues[index].receivedQuantity !== issues[index].expectedQuantity && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        ⚠️ Diferencia detectada:
                        {issues[index].receivedQuantity < issues[index].expectedQuantity
                          ? ` Faltan ${issues[index].expectedQuantity - issues[index].receivedQuantity} unidades`
                          : ` Sobran ${issues[index].receivedQuantity - issues[index].expectedQuantity} unidades`
                        }
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notas generales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas generales (opcional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones generales sobre la verificación..."
                rows={3}
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || verifyMutation.isPending}
                className="flex items-center gap-2"
              >
                {isSubmitting || verifyMutation.isPending ? (
                  <>
                    <Loader className="h-4 w-4" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Completar Verificación
                  </>
                )}
              </Button>
              <Button onClick={goBack} variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de productos (solo lectura si no puede verificar) */}
      {!canVerify && (
        <Card>
          <CardHeader>
            <CardTitle>Productos del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Código: {item.product.code}</p>
                  </div>
                  <Badge variant="outline">
                    {item.quantity} unidades
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OrderVerificationForm