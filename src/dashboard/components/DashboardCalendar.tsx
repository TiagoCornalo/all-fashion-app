import { useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button
} from '../../components'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg } from '@fullcalendar/core'
import esLocale from '@fullcalendar/core/locales/es'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  description: string
  sales?: number
  total?: number
  cash?: number
  debitCard?: number
  creditCard?: number
  transfer?: number
}

const DashboardCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const events = [
    {
      id: '1',
      title: 'Cierre de Caja',
      start: '2024-12-22',
      description: 'Cierre de caja del día.',
      sales: 25,
      total: 45231.89,
      cash: 30000,
      debitCard: 15231.89,
      creditCard: 15231.89,
      transfer: 15231.89
    },
    {
      id: '2',
      title: 'Pedido a Proveedor',
      start: '2024-12-23',
      description: 'Realizar pedido al proveedor XYZ.'
    },
    {
      id: '3',
      title: 'Evento Especial',
      start: '2024-12-24',
      end: '2024-12-25',
      description: 'Celebración especial.'
    }
  ]

  const handleEventClick = (info: EventClickArg) => {
    const event = events.find((e) => e.id === info.event.id)
    if (event) {
      setSelectedEvent(event)
      setIsDialogOpen(true)
    }
  }

  return (
    <div>
      {/* Dialog para mostrar detalles del evento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title || 'Evento'}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.description || 'Detalles del evento.'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {selectedEvent?.sales && (
              <>
                <p>
                  <strong>Ventas Totales:</strong> {selectedEvent.sales}
                </p>
                <p>
                  <strong>Total Cerrado:</strong> $
                  {selectedEvent.total?.toLocaleString() || '0'}
                </p>
                <p>
                  <strong>En Efectivo:</strong> $
                  {selectedEvent.cash?.toLocaleString() || '0'}
                </p>
                <p>
                  <strong>Con Tarjeta Débito:</strong> $
                  {selectedEvent.debitCard?.toLocaleString() || '0'}
                </p>
                <p>
                  <strong>Con Tarjeta Crédito:</strong> $
                  {selectedEvent.creditCard?.toLocaleString() || '0'}
                </p>
                <p>
                  <strong>Con Transferencia:</strong> $
                  {selectedEvent.transfer?.toLocaleString() || '0'}
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendario */}
      <Card className='bg-white p-4 shadow-md rounded-lg'>
        <CardHeader>
          <CardTitle>Calendario</CardTitle>
        </CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView='dayGridWeek'
            events={events}
            eventClick={handleEventClick}
            locale={esLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día'
            }}
            editable={true}
            selectable={true}
            height='auto'
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardCalendar
