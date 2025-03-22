import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger, Button, Calendar } from '..'

interface DatePickerProps {
  date: Date | null
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Componente DatePicker personalizado
 * @param date - Fecha seleccionada actualmente
 * @param onChange - Función callback para cuando cambia la fecha
 * @param placeholder - Texto a mostrar cuando no hay fecha seleccionada
 * @param className - Clases CSS adicionales para el botón
 * @param disabled - Indica si el componente está deshabilitado
 */
const DatePicker = ({
  date,
  onChange,
  placeholder = 'Seleccionar fecha',
  className = '',
  disabled = false
}: DatePickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? (
            format(date, 'dd/MM/yyyy', { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={date || undefined}
          onSelect={onChange}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
