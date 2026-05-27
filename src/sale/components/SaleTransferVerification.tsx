import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '../../components'
import {
  CheckCircle,
  XCircle,
  Phone,
  AlertTriangle,
  Clock,
  User,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { Payment } from '../../types/sale.types'
import { verifyTransfer, getSupplierDetail } from '../../services/transferVerification'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { formatDateTime } from '../../utils'

interface SaleTransferVerificationProps {
  saleId: string
  payments: Payment[]
  items: Array<{
    product: {
      _id: string
      name: string
      supplier: string
    }
    quantity: number
  }>
}

const verificationSchema = z.object({
  notes: z.string().optional()
})

type VerificationFormValues = z.infer<typeof verificationSchema>

/**
 * Componente para mostrar y manejar la verificación de transferencias
 * Permite al administrador verificar transferencias y reenviar comprobantes a proveedores
 */
const SaleTransferVerification = ({ saleId, payments, items }: SaleTransferVerificationProps) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showResendModal, setShowResendModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [verificationAction, setVerificationAction] = useState<'verify' | 'reject'>('verify')

  const queryClient = useQueryClient()

  // Filtrar solo pagos por transferencia
  const transferPayments = payments.filter(payment => payment.method === 'TRANSFER')

  // Obtener proveedores únicos de los productos
  const supplierIds = [...new Set(items.map(item => item.product.supplier))]

  // Query para obtener información de proveedores
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', supplierIds],
    queryFn: async () => {
      const supplierPromises = supplierIds.map(id => getSupplierDetail(id))
      return Promise.all(supplierPromises)
    },
    enabled: supplierIds.length > 0
  })

  // Formulario de verificación
  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { notes: '' }
  })

  // Mutación para verificar transferencia
  const verifyMutation = useMutation({
    mutationFn: (data: { paymentId: string; verified: boolean; notes?: string }) =>
      verifyTransfer(saleId, data),
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['sale', saleId] })
      setShowVerificationModal(false)
      verificationForm.reset()
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      toast.error(error.response?.data?.error || 'Error al verificar transferencia')
    }
  })

  /**
   * Abre el modal de verificación
   */
  const handleVerificationClick = (payment: Payment, action: 'verify' | 'reject') => {
    setSelectedPayment(payment)
    setVerificationAction(action)
    setShowVerificationModal(true)
  }

  /**
   * Abre WhatsApp Web con el chat del cliente
   */
  const handleOpenWhatsApp = (customerPhone: string) => {
    if (!customerPhone) {
      toast.error('No hay número de teléfono disponible')
      return
    }

    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = customerPhone.replace(/[^\d+]/g, '')

    // Construir URL de WhatsApp Web
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`

    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

    toast.info('Abriendo WhatsApp Web...')
  }

  /**
   * Abre el modal de reenvío
   */
  const handleResendClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowResendModal(true)
  }

  /**
   * Procesa la verificación
   */
  const handleVerificationSubmit = (data: VerificationFormValues) => {
    if (!selectedPayment?._id) return

    verifyMutation.mutate({
      paymentId: selectedPayment._id,
      verified: verificationAction === 'verify',
      notes: data.notes
    })
  }

  /**
   * Obtiene el estado visual del pago
   */
  const getPaymentStatus = (payment: Payment) => {
    if (payment.verified === true) {
      return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Verificado' }
    }
    if (payment.verified === false) {
      return { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rechazado' }
    }
    return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' }
  }

  if (transferPayments.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base sm:text-lg'>
            <Phone className='h-4 w-4 sm:h-5 sm:w-5' />
            Verificación de Transferencias
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 sm:space-y-4'>
          {transferPayments.map((payment, index) => {
            const status = getPaymentStatus(payment)
            const StatusIcon = status.icon

            return (
              <div key={payment._id || index} className='border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <StatusIcon className='h-4 w-4 sm:h-5 sm:w-5' />
                    <span className='font-medium text-sm sm:text-base'>Transferencia ${payment.amount.toFixed(2)}</span>
                    <Badge className={`${status.color} text-xs`}>{status.text}</Badge>
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm'>
                  <div>
                    <span className='font-medium'>Teléfono del cliente:</span>
                    <div className='flex flex-col sm:flex-row sm:items-center gap-2 mt-1'>
                      <div className='flex items-center gap-2'>
                        <Phone className='h-3 w-3 sm:h-4 sm:w-4' />
                        <span>{payment.customerPhone || 'No proporcionado'}</span>
                      </div>
                      {payment.customerPhone && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleOpenWhatsApp(payment.customerPhone!)}
                          className='h-6 sm:h-7 px-2 text-xs w-full sm:w-auto'
                        >
                          <MessageCircle className='h-3 w-3 mr-1' />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='font-medium'>Referencia:</span>
                    <div className='mt-1 break-all'>{payment.transferReference || 'No proporcionado'}</div>
                  </div>
                </div>

                {/* Información de proveedores */}
                {suppliers && suppliers.length > 0 && (
                  <div className='bg-blue-50 p-3 sm:p-4 rounded-md'>
                    <div className='text-xs sm:text-sm font-medium text-blue-800 mb-3'>
                      {suppliers.length === 1 ? 'Proveedor:' : `Proveedores (${suppliers.length}):`}
                    </div>
                    <div className='space-y-2 sm:space-y-3'>
                      {suppliers.map((supplier) => {
                        // Encontrar productos de este proveedor
                        const supplierProducts = items.filter(item =>
                          item.product.supplier === supplier._id
                        );

                        return (
                          <div key={supplier._id} className='bg-white p-2 sm:p-3 rounded border'>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                              <div className='flex-1 min-w-0'>
                                <span className='font-medium text-gray-900 text-sm sm:text-base truncate block'>{supplier.name}</span>
                                {supplier.contact?.phone && (
                                  <span className='text-gray-600 text-xs sm:text-sm'>
                                    📞 {supplier.contact.phone}
                                  </span>
                                )}
                              </div>
                              {supplier.contact?.phone && (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => supplier.contact?.phone && handleOpenWhatsApp(supplier.contact.phone)}
                                  className='h-6 sm:h-7 px-2 text-xs w-full sm:w-auto flex-shrink-0'
                                >
                                  <MessageCircle className='h-3 w-3 mr-1' />
                                  WhatsApp
                                </Button>
                              )}
                            </div>

                            {/* Productos de este proveedor */}
                            {supplierProducts.length > 0 && (
                              <div className='text-xs text-gray-600 bg-gray-50 p-2 rounded'>
                                <span className='font-medium'>Productos: </span>
                                <div className='mt-1 space-y-1'>
                                  {supplierProducts.map((item, idx) => (
                                    <div key={item.product._id} className='break-words'>
                                      • {item.product.name} (x{item.quantity})
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {payment.verified !== undefined && (
                  <div className='bg-gray-50 p-3 sm:p-4 rounded-md space-y-2'>
                    <div className='flex items-center gap-2 text-xs sm:text-sm'>
                      <User className='h-3 w-3 sm:h-4 sm:w-4' />
                      <span className='font-medium'>
                        {payment.verified ? 'Verificado' : 'Rechazado'}
                        {payment.verificationDate && ` el ${formatDateTime(new Date(payment.verificationDate))}`}
                      </span>
                    </div>
                    {payment.verificationNotes && (
                      <div className='text-xs sm:text-sm text-gray-600'>
                        <span className='font-medium'>Notas:</span> {payment.verificationNotes}
                      </div>
                    )}
                  </div>
                )}

                <div className='flex flex-col sm:flex-row gap-2 pt-2'>
                  {payment.verified === undefined && (
                    <>
                      <Button
                        size='sm'
                        onClick={() => handleVerificationClick(payment, 'verify')}
                        className='bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm'
                      >
                        <CheckCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                        Verificar
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleVerificationClick(payment, 'reject')}
                        className='w-full sm:w-auto text-xs sm:text-sm'
                      >
                        <XCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                        Rechazar
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleResendClick(payment)}
                        className='w-full sm:w-auto text-xs sm:text-sm'
                      >
                        <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                        Ver Comprobante
                      </Button>
                    </>
                  )}

                  {payment.verified === true && (
                    <div className='text-xs sm:text-sm text-green-700 font-medium text-center sm:text-left'>
                      ✅ Transferencia verificada y procesada
                    </div>
                  )}

                  {payment.verified === false && (
                    <div className='text-xs sm:text-sm text-red-700 font-medium text-center sm:text-left'>
                      ❌ Transferencia rechazada
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Modal de Verificación */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className='w-[95vw] max-w-md sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-base sm:text-lg'>
              {verificationAction === 'verify' ? (
                <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-600' />
              ) : (
                <XCircle className='h-4 w-4 sm:h-5 sm:w-5 text-red-600' />
              )}
              {verificationAction === 'verify' ? 'Verificar' : 'Rechazar'} Transferencia
            </DialogTitle>
          </DialogHeader>

          <Form {...verificationForm}>
            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <div className='text-xs sm:text-sm text-gray-600'>
                  <strong>Monto:</strong> ${selectedPayment?.amount.toFixed(2)}
                </div>
                <div className='text-xs sm:text-sm text-gray-600'>
                  <strong>Teléfono:</strong> {selectedPayment?.customerPhone}
                </div>
              </div>

              <FormField
                control={verificationForm.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm'>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Agregar notas sobre la verificación...'
                        className='text-sm'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className='flex flex-col sm:flex-row gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowVerificationModal(false)}
                  className='w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm'
                >
                  Cancelar
                </Button>
                <Button
                  type='submit'
                  disabled={verifyMutation.isPending}
                  className={`w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm ${verificationAction === 'verify' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  variant={verificationAction === 'verify' ? 'default' : 'destructive'}
                >
                  {verifyMutation.isPending ? 'Procesando...' :
                    verificationAction === 'verify' ? 'Verificar' : 'Rechazar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de Reenvío */}
      <Dialog open={showResendModal} onOpenChange={setShowResendModal}>
        <DialogContent className='w-[95vw] max-w-md sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle className='flex items-center gap-2 text-base sm:text-lg'>
              <MessageCircle className='h-4 w-4 sm:h-5 sm:w-5 text-blue-600' />
              {selectedPayment?.verified === undefined
                ? 'Verificar Comprobante de Transferencia'
                : 'Ver Comprobante de Transferencia'
              }
            </DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-auto space-y-4'>
            {/* Información de la transferencia */}
            <div className='space-y-2 text-xs sm:text-sm bg-gray-50 p-3 rounded-md'>
              <div><strong>Cliente:</strong> {selectedPayment?.customerPhone}</div>
              <div><strong>Monto:</strong> ${selectedPayment?.amount.toFixed(2)}</div>
              <div className='break-all'><strong>Referencia:</strong> {selectedPayment?.transferReference}</div>
            </div>

            {/* Botón para abrir WhatsApp del cliente */}
            <div className='bg-green-50 p-3 rounded-md'>
              <div className='text-xs sm:text-sm font-medium text-green-800 mb-2'>
                {selectedPayment?.verified === undefined
                  ? '1. Ver comprobante del cliente:'
                  : 'Ver comprobante del cliente:'
                }
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={() => selectedPayment?.customerPhone && handleOpenWhatsApp(selectedPayment.customerPhone)}
                disabled={!selectedPayment?.customerPhone}
                className='w-full text-xs sm:text-sm'
              >
                <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-2' />
                Abrir WhatsApp del Cliente
                <ExternalLink className='h-3 w-3 ml-2' />
              </Button>
            </div>

            {/* Información de proveedores disponibles */}
            {suppliers && suppliers.length > 0 && selectedPayment?.verified === undefined && (
              <div className='bg-blue-50 p-3 rounded-md'>
                <div className='text-xs sm:text-sm font-medium text-blue-800 mb-3'>
                  2. Reenviar al proveedor ({suppliers.length === 1 ? '1 proveedor' : `${suppliers.length} proveedores`}):
                </div>
                <div className='space-y-3'>
                  {suppliers.map((supplier) => {
                    // Encontrar productos de este proveedor en la venta
                    const supplierProducts = items.filter(item =>
                      item.product.supplier === supplier._id
                    );

                    return (
                      <div key={supplier._id} className='p-2 sm:p-3 bg-white rounded border'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-gray-900 text-sm truncate'>{supplier.name}</div>
                            {supplier.contact?.phone && (
                              <div className='text-xs text-gray-600'>📞 {supplier.contact.phone}</div>
                            )}
                            {supplier.contact?.email && (
                              <div className='text-xs text-gray-600'>✉️ {supplier.contact.email}</div>
                            )}
                          </div>
                          {supplier.contact?.phone && (
                            <Button
                              type='button'
                              size='sm'
                              onClick={() => supplier.contact?.phone && handleOpenWhatsApp(supplier.contact.phone)}
                              className='bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs flex-shrink-0'
                            >
                              <MessageCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                              WhatsApp
                            </Button>
                          )}
                        </div>

                        {/* Productos de este proveedor */}
                        {supplierProducts.length > 0 && (
                          <div className='bg-gray-50 p-2 rounded text-xs'>
                            <span className='font-medium text-gray-700'>Sus productos en esta venta: </span>
                            <div className='mt-1 space-y-1'>
                              {supplierProducts.map((item, idx) => (
                                <div key={item.product._id} className='text-gray-600 break-words'>
                                  • {item.product.name} (x{item.quantity})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instrucciones del proceso */}
            {selectedPayment?.verified === undefined ? (
              <div className='bg-yellow-50 p-3 sm:p-4 rounded-md flex items-start gap-3'>
                <AlertTriangle className='h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0' />
                <div className='text-xs sm:text-sm text-yellow-800'>
                  <div className='font-medium mb-2'>Proceso de verificación:</div>
                  <ol className='list-decimal list-inside space-y-1 text-xs sm:text-sm'>
                    <li>Haga clic en &quot;Abrir WhatsApp del Cliente&quot; para ver el comprobante</li>
                    <li>Descargue o tome captura del comprobante</li>
                    <li>Use los botones de WhatsApp de cada proveedor para reenviar</li>
                    <li>Cierre este modal y marque la transferencia como verificada</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className='bg-green-50 p-3 sm:p-4 rounded-md flex items-start gap-3'>
                <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0' />
                <div className='text-xs sm:text-sm text-green-800'>
                  <div className='font-medium mb-2'>Transferencia ya verificada</div>
                  <p>Esta transferencia fue verificada el {selectedPayment.verificationDate && new Date(selectedPayment.verificationDate).toLocaleString('es-ES')}.</p>
                  {selectedPayment.verificationNotes && (
                    <p className='mt-1'><strong>Notas:</strong> {selectedPayment.verificationNotes}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='flex-shrink-0 pt-3 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setShowResendModal(false)}
              className='w-full text-xs sm:text-sm'
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default SaleTransferVerification