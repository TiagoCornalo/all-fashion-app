import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components'
import { registerServicePayment } from '../../services/technical-service.service'
import { RegisterPaymentDto } from '../../types/technical-service.types'
import { formatCurrency } from '../../utils'
import {
  CreditCard,
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface PaymentDialogProps {
  serviceId: string | null
  totalCost: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onPaymentRegistered?: () => void
}

/**
 * Dialog para registrar pagos de servicios técnicos
 */
const PaymentDialog = ({
  serviceId,
  totalCost,
  isOpen,
  onOpenChange,
  onPaymentRegistered
}: PaymentDialogProps) => {
  const queryClient = useQueryClient()
  const [paymentData, setPaymentData] = useState<RegisterPaymentDto>({
    paymentMethod: 'CASH',
    amount: totalCost,
    notes: ''
  })
  const [registerInCash, setRegisterInCash] = useState(true)

  // Mutación para registrar pago
  const paymentMutation = useMutation({
    mutationFn: (data: { serviceId: string; paymentData: RegisterPaymentDto & { registerInCash?: boolean } }) =>
      registerServicePayment(data.serviceId, data.paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['technical-services'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      onPaymentRegistered?.()
      onOpenChange(false)
      resetForm()
    }
  })

  const resetForm = () => {
    setPaymentData({
      paymentMethod: 'CASH',
      amount: totalCost,
      notes: ''
    })
    setRegisterInCash(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceId || paymentData.amount <= 0) return

    const paymentDataWithCash = {
      ...paymentData,
      registerInCash
    }

    paymentMutation.mutate({
      serviceId,
      paymentData: paymentDataWithCash
    })
  }

  const isFormValid = paymentData.amount > 0 && paymentData.paymentMethod

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentData({
        paymentMethod: 'CASH',
        amount: totalCost,
        notes: ''
      })
    } else {
      resetForm()
    }
  }, [isOpen, totalCost])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Registrar Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del monto */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Total del Servicio</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(totalCost)}
                </p>
              </div>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago *
            </label>
            <select
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                paymentMethod: e.target.value as RegisterPaymentDto['paymentMethod']
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="CASH">Efectivo</option>
              <option value="CREDIT_CARD">Tarjeta de Crédito</option>
              <option value="DEBIT_CARD">Tarjeta de Débito</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CHECK">Cheque</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Pagado *
            </label>
            <div className="relative">
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  amount: Number(e.target.value)
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </div>
            </div>
            {paymentData.amount !== totalCost && (
              <div className="mt-2">
                {paymentData.amount > totalCost ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm">
                      Cambio: {formatCurrency(paymentData.amount - totalCost)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm">
                      Pendiente: {formatCurrency(totalCost - paymentData.amount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Registrar en caja */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="registerInCash"
              checked={registerInCash}
              onChange={(e) => setRegisterInCash(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <label htmlFor="registerInCash" className="text-sm text-gray-700">
              Registrar en caja registradora
            </label>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Información adicional sobre el pago..."
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={paymentMutation.isPending}
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={!isFormValid || paymentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {paymentMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle size={16} className="mr-2" />
              )}
              {paymentMutation.isPending ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </div>

          {/* Estado de error */}
          {paymentMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertTriangle size={16} />
              <span className="text-sm">
                Error al registrar el pago. Intente nuevamente.
              </span>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PaymentDialog