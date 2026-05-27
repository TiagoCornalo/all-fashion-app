import { RefreshCw, AlertTriangle, DollarSign } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '../../components'
import {
  useExchangeRate,
  useRefreshExchangeRate
} from '../../hooks/useExchangeRate'

const LABELS_BY_TYPE: Record<string, string> = {
  oficial: 'Dólar oficial',
  blue: 'Dólar blue',
  mep: 'Dólar MEP',
  tarjeta: 'Dólar tarjeta'
}

const formatRate = (value?: number) =>
  typeof value === 'number'
    ? value.toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2
      })
    : '—'

const ExchangeRateBadge = () => {
  const { data, isLoading, isError } = useExchangeRate()
  const refresh = useRefreshExchangeRate()

  const handleRefresh = async () => {
    try {
      const result = await refresh.mutateAsync()
      if (result.recalc?.recalculated > 0) {
        toast.success(
          `Cotización actualizada. ${result.recalc.recalculated} productos recalculados.`
        )
      } else {
        toast.success('Cotización actualizada.')
      }
    } catch (err) {
      toast.error('No se pudo actualizar la cotización')
      console.error(err)
    }
  }

  if (isLoading) {
    return (
      <div className='inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground'>
        Cargando cotización...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs text-destructive'>
        <AlertTriangle className='h-3.5 w-3.5' />
        Cotización no disponible
        <Button
          size='sm'
          variant='ghost'
          onClick={handleRefresh}
          disabled={refresh.isPending}
          className='h-6 px-1'
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refresh.isPending ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>
    )
  }

  const typeLabel = LABELS_BY_TYPE[data.type] || data.type
  const fetched = data.fetchedAt ? new Date(data.fetchedAt) : null
  const fetchedLabel = fetched
    ? fetched.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

  return (
    <div className='inline-flex flex-wrap items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs'>
      <DollarSign className='h-3.5 w-3.5 text-green-700' />
      <span className='font-medium'>{typeLabel}:</span>
      <span className='font-semibold'>{formatRate(data.value)}</span>
      {data.surchargeArs > 0 && (
        <span className='text-muted-foreground'>
          + {formatRate(data.surchargeArs)} de recargo
        </span>
      )}
      <span className='text-muted-foreground'>· Actualizado {fetchedLabel}</span>
      {!data.enabled && (
        <span className='inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700'>
          USD apagado
        </span>
      )}
      <Button
        size='sm'
        variant='ghost'
        onClick={handleRefresh}
        disabled={refresh.isPending}
        className='h-6 px-1'
        title='Refrescar cotización y recalcular precios'
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${refresh.isPending ? 'animate-spin' : ''}`}
        />
      </Button>
    </div>
  )
}

export default ExchangeRateBadge
