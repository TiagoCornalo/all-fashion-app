import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  Badge
} from '../../components'
import { adminApproveOrder } from '../../services/order'
import { toast } from 'react-toastify'
import { CheckCircle, XCircle, User, Calendar, Package } from 'lucide-react'
import { formatDateTime } from '../../utils'
import { RECEPTION_STATUS } from '../../orders/components/verification/constants'

interface OrderItem {
  _id: string
  product: {
    _id: string
    name: string
    code: string
    price: number
  }
  quantity: number
  currentStock: number
  minimumStock: number
}

interface PendingOrder {
  _id: string
  supplier: {
    _id: string
    name: string
    contact: {
      email: string
      phone: string
    }
  }
  items: OrderItem[]
  status: string
  receptionStatus: string
  employeeVerification: {
    verifiedBy: {
      _id: string
      name: string
    }
    verificationDate: string
    employeeNotes?: string
    discrepancies?: Array<{
      productId: string
      expectedQuantity: number
      receivedQuantity: number
      notes: string
    }>
  }
  confirmedArrivalBy: {
    _id: string
    name: string
  }
  scheduledArrivalDate?: string
  notes?: string
  createdAt: string
  totalQuantity: number
}

interface AdminApprovalDialogProps {
  order: PendingOrder | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onOrderUpdated: () => void
}

// Schema de validación
const adminApprovalSchema = z.object({
  approved: z.boolean(),
  adminNotes: z.string().optional()
})

type AdminApprovalFormValues = z.infer<typeof adminApprovalSchema>

/**
 * Modal para que el admin apruebe o rechace verificaciones de empleados
 */
const AdminApprovalDialog = ({
  order,
  isOpen,
  onOpenChange,
  onOrderUpdated
}: AdminApprovalDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<boolean | null>(null)

  const form = useForm<AdminApprovalFormValues>({
    resolver: zodResolver(adminApprovalSchema),
    defaultValues: {
      approved: true,
      adminNotes: ''
    }
  })

  // Resetear formulario cuando se abre el modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
      setSelectedAction(null)
    }
    onOpenChange(open)
  }

  const handleApprove = () => {
    setSelectedAction(true)
    form.setValue('approved', true)
  }

  const handleReject = () => {
    setSelectedAction(false)
    form.setValue('approved', false)
  }

  const onSubmit = async (values: AdminApprovalFormValues) => {
    if (!order || selectedAction === null) return

    try {
      setIsSubmitting(true)

      await adminApproveOrder(order._id, {
        approved: values.approved,
        adminNotes: values.adminNotes || undefined
      })

      const message = values.approved
        ? 'Verificación aprobada exitosamente'
        : 'Verificación rechazada, pedido devuelto para nueva verificación'

      toast.success(message)
      onOrderUpdated()
      handleOpenChange(false)
    } catch (error: unknown) {
      console.error('Error al procesar aprobación:', error)
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al procesar la aprobación'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-[700px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5 text-blue-600' />
            Revisar Verificación de Pedido
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Información del pedido */}
          <div className='p-4 bg-blue-50 rounded-lg'>
            <h4 className='font-medium text-blue-800 mb-2'>Información del Pedido</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='font-medium'>Proveedor:</span>
                <div>{order.supplier.name}</div>
              </div>
              <div>
                <span className='font-medium'>Total productos:</span>
                <div>{order.totalQuantity} unidades</div>
              </div>
              <div>
                <span className='font-medium'>Estado:</span>
                <div>
                  <Badge variant='secondary'>{RECEPTION_STATUS[order.receptionStatus as keyof typeof RECEPTION_STATUS]}</Badge>
                </div>
              </div>
              <div>
                <span className='font-medium'>Llegada confirmada por:</span>
                <div>{order.confirmedArrivalBy?.name}</div>
              </div>
            </div>
          </div>

          {/* Información de la verificación del empleado */}
          <div className='p-4 bg-yellow-50 rounded-lg'>
            <h4 className='font-medium text-yellow-800 mb-2 flex items-center gap-2'>
              <User className='h-4 w-4' />
              Verificación del Empleado
            </h4>
            <div className='space-y-2 text-sm'>
              <div>
                <span className='font-medium'>Verificado por:</span>
                <div>{order.employeeVerification.verifiedBy.name}</div>
              </div>
              <div>
                <span className='font-medium'>Fecha de verificación:</span>
                <div>{formatDateTime(new Date(order.employeeVerification.verificationDate))}</div>
              </div>
              {order.employeeVerification.employeeNotes && (
                <div>
                  <span className='font-medium'>Notas del empleado:</span>
                  <div className='mt-1 p-2 bg-white rounded border text-gray-700'>
                    {order.employeeVerification.employeeNotes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discrepancias si las hay */}
          {order.employeeVerification.discrepancies && order.employeeVerification.discrepancies.length > 0 && (
            <div className='p-4 bg-red-50 rounded-lg'>
              <h4 className='font-medium text-red-800 mb-2'>Discrepancias Reportadas</h4>
              <div className='space-y-2'>
                {order.employeeVerification.discrepancies.map((discrepancy, index) => (
                  <div key={index} className='p-2 bg-white rounded border text-sm'>
                    <div className='font-medium'>Producto ID: {discrepancy.productId}</div>
                    <div>Esperado: {discrepancy.expectedQuantity} | Recibido: {discrepancy.receivedQuantity}</div>
                    {discrepancy.notes && <div className='text-gray-600'>Notas: {discrepancy.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos del pedido */}
          <div>
            <h4 className='font-medium mb-3 flex items-center gap-2'>
              <Package className='h-4 w-4' />
              Productos en el Pedido ({order.items.length})
            </h4>
            <div className='max-h-40 overflow-y-auto space-y-2'>
              {order.items.map((item) => (
                <div key={item._id} className='flex justify-between items-center p-2 bg-gray-50 rounded text-sm'>
                  <div>
                    <div className='font-medium'>{item.product.name}</div>
                    <div className='text-gray-600'>Código: {item.product.code}</div>
                  </div>
                  <div className='text-right'>
                    <div className='font-medium'>Cantidad: {item.quantity}</div>
                    <div className='text-gray-600'>${item.product.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className='flex gap-4 p-4 bg-gray-50 rounded-lg'>
            <Button
              type='button'
              variant={selectedAction === true ? 'default' : 'outline'}
              className={selectedAction === true ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}
              onClick={handleApprove}
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              Aprobar Verificación
            </Button>
            <Button
              type='button'
              variant={selectedAction === false ? 'default' : 'outline'}
              className={selectedAction === false ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}
              onClick={handleReject}
            >
              <XCircle className='h-4 w-4 mr-2' />
              Rechazar Verificación
            </Button>
          </div>

          {/* Formulario para notas del admin */}
          {selectedAction !== null && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                <FormField
                  control={form.control}
                  name='adminNotes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Notas del Administrador {selectedAction === false && '(requeridas para rechazo)'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={selectedAction
                            ? 'Agregar notas sobre la aprobación (opcional)...'
                            : 'Explicar por qué se rechaza la verificación...'
                          }
                          className='resize-none'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className={selectedAction ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {isSubmitting
                      ? 'Procesando...'
                      : selectedAction
                        ? 'Confirmar Aprobación'
                        : 'Confirmar Rechazo'
                    }
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminApprovalDialog