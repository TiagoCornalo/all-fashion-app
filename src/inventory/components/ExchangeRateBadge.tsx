import { RefreshCw, AlertTriangle, DollarSign } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '../../components'
import {
  useExchangeRate,
  useRefreshExchangeRate
} from '../../hooks/useExchangeRate'
import { USDRateType } from '../../types/inventory.types'

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

type Props = {
  type?: USDRateType
}

const ExchangeRateBadge = ({ type = 'blue' }: Props) => {
  const { data, isLoading, isError } = useExchangeRate(type)
  const refresh = useRefreshExchangeRate(type)

  const handleRefresh = async () => {
    try {
      const result = await refresh.mutateAsync()
      if (result.recalc?.recalculated > 0) {
        const details = result.recalc.byType
          ? Object.entries(result.recalc.byType)
              .map(([rateType, info]) => `${LABELS_BY_TYPE[rateType] || rateType}: ${info.recalculated}`)
              .join(' · ')
          : `${result.recalc.recalculated} productos recalculados`
        toast.success(
          `Cotización actualizada. ${details}.`
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
      <div className='flex min-h-14 w-full items-center rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground sm:w-[220px]'>
        Cargando {LABELS_BY_TYPE[type] || type}...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='flex min-h-14 w-full items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive sm:w-[220px]'>
        <AlertTriangle className='h-4 w-4 shrink-0' />
        <span className='min-w-0 flex-1 truncate'>
          {LABELS_BY_TYPE[type] || type} no disponible
        </span>
        <Button
          size='sm'
          variant='ghost'
          onClick={handleRefresh}
          disabled={refresh.isPending}
          className='h-8 w-8 shrink-0 p-0'
          title='Refrescar cotización y recalcular precios'
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
    <div className='flex min-h-14 w-full items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs shadow-sm sm:w-[220px]'>
      <DollarSign className='h-4 w-4 shrink-0 text-green-700' />
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-baseline gap-1.5'>
          <span className='truncate font-medium'>{typeLabel}</span>
          <span className='shrink-0 font-semibold'>{formatRate(data.value)}</span>
        </div>
        <div className='mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-4 text-muted-foreground'>
          {data.surchargeArs > 0 && (
            <span className='whitespace-nowrap'>+ {formatRate(data.surchargeArs)}</span>
          )}
          <span className='whitespace-nowrap'>Actualizado {fetchedLabel}</span>
          {!data.enabled && (
            <span className='rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700'>
              USD apagado
            </span>
          )}
        </div>
      </div>
      <Button
        size='sm'
        variant='ghost'
        onClick={handleRefresh}
        disabled={refresh.isPending}
        className='h-8 w-8 shrink-0 p-0'
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
