import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/index'
import {
  AlertTriangle,
  Phone,
  Eye,
  Calendar,
  DollarSign,
  User,
  Clock,
  MessageCircle
} from 'lucide-react'
import { getPendingTransfers } from '../../services/transferVerification'
import { formatDateTime, formatCurrency } from '../../utils'
import { useNavigate } from 'react-router-dom'
import { Sale } from '../../types/sale.types'

interface PendingTransfersPanelProps {
  showAsDialog?: boolean
  maxHeight?: string
}

/**
 * Panel para mostrar todas las transferencias pendientes de verificación
 * Puede mostrarse como componente independiente o dentro de un dialog
 */
const PendingTransfersPanel = ({
  showAsDialog = false,
  maxHeight = '400px'
}: PendingTransfersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // Query para obtener transferencias pendientes
  const { data: pendingTransfers, isLoading, refetch } = useQuery({
    queryKey: ['pending-transfers'],
    queryFn: () => getPendingTransfers({ pageSize: 50 }),
    refetchInterval: 30000 // Refrescar cada 30 segundos
  })

  /**
   * Navega al detalle de la venta
   */
  const handleViewSale = (saleId: string) => {
    navigate(`/sale/${saleId}`)
    if (showAsDialog) {
      setIsOpen(false)
    }
  }

  /**
   * Abre WhatsApp Web con el número especificado
   */
  const handleOpenWhatsApp = (phone: string) => {
    if (!phone) return

    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  /**
   * Obtiene el total de transferencias pendientes
   */
  const getTotalPendingAmount = () => {
    if (!pendingTransfers?.data) return 0

    return pendingTransfers.data.reduce((total, sale) => {
      const transferAmount = sale.transferPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      return total + transferAmount
    }, 0)
  }

  /**
   * Renderiza el contenido del panel
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      )
    }

    if (!pendingTransfers?.data || pendingTransfers.data.length === 0) {
      return (
        <div className='text-center py-8 text-gray-500'>
          <Clock className='h-12 w-12 mx-auto mb-4 text-gray-300' />
          <p>No hay transferencias pendientes de verificación</p>
        </div>
      )
    }

    return (
      <div className='space-y-4'>
        {/* Resumen */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              <span className='font-medium text-yellow-800'>Pendientes</span>
            </div>
            <div className='text-2xl font-bold text-yellow-900'>
              {pendingTransfers.data.length}
            </div>
          </div>

          <div className='bg-blue-50 p-4 rounded-lg'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5 text-blue-600' />
              <span className='font-medium text-blue-800'>Monto Total</span>
            </div>
            <div className='text-2xl font-bold text-blue-900'>
              {formatCurrency(getTotalPendingAmount())}
            </div>
          </div>

          <div className='bg-green-50 p-4 rounded-lg'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-green-600' />
              <span className='font-medium text-green-800'>Última actualización</span>
            </div>
            <div className='text-sm font-medium text-green-900'>
              {formatDateTime(new Date())}
            </div>
          </div>
        </div>

        {/* Tabla de transferencias */}
        <div className={`overflow-auto ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTransfers.data.map((sale: Sale) => {
                const transferPayment = sale.transferPayments?.[0]
                if (!transferPayment) return null

                return (
                  <TableRow key={sale._id}>
                    <TableCell>
                      <div className='font-medium'>#{sale._id.slice(-8)}</div>
                      <div className='text-sm text-gray-500'>
                        {sale.items.length} producto(s)
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Phone className='h-4 w-4 text-gray-400' />
                        <span className='text-sm'>
                          {transferPayment.customerPhone || 'No proporcionado'}
                        </span>
                        {transferPayment.customerPhone && (
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleOpenWhatsApp(transferPayment.customerPhone!)}
                            className='h-6 w-6 p-0'
                          >
                            <MessageCircle className='h-3 w-3 text-green-600' />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='font-medium'>
                        {formatCurrency(transferPayment.amount)}
                      </div>
                      <Badge className='bg-yellow-100 text-yellow-800 text-xs'>
                        Pendiente
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className='text-sm'>
                        {formatDateTime(new Date(sale.createdAt))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4 text-gray-400' />
                        <span className='text-sm'>{sale.seller.name}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleViewSale(sale._id)}
                        className='flex items-center gap-1'
                      >
                        <Eye className='h-4 w-4' />
                        Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Botón de actualizar */}
        <div className='flex justify-end'>
          <Button
            variant='outline'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        </div>
      </div>
    )
  }

  if (showAsDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant='outline' className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            Transferencias Pendientes
            {pendingTransfers?.data && pendingTransfers.data.length > 0 && (
              <Badge className='bg-red-100 text-red-800 ml-1'>
                {pendingTransfers.data.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-6xl max-h-[80vh] overflow-hidden'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              Transferencias Pendientes de Verificación
            </DialogTitle>
          </DialogHeader>
          <div className='overflow-auto'>
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-yellow-600' />
          Transferencias Pendientes de Verificación
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  )
}

export default PendingTransfersPanel