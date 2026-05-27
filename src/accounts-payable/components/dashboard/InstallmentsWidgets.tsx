import { useQuery } from '@tanstack/react-query'
import { CalendarClock, AlertTriangle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loader
} from '../../../components'
import { accountsPayableService } from '../../../services/accountsPayable.service'

const formatCurrency = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

const InstallmentsWidgets = () => {
  const upcomingQuery = useQuery({
    queryKey: ['installments-upcoming', 7],
    queryFn: () => accountsPayableService.getUpcomingInstallments(7),
    staleTime: 60_000
  })

  const overdueQuery = useQuery({
    queryKey: ['installments-overdue'],
    queryFn: () => accountsPayableService.getOverdueInstallments(),
    staleTime: 60_000
  })

  const upcoming = upcomingQuery.data?.data ?? []
  const overdue = overdueQuery.data?.data ?? []

  const totalUpcomingAmount = upcoming.reduce((s, i) => s + i.pendingAmount, 0)
  const totalOverdueAmount = overdue.reduce((s, i) => s + i.pendingAmount, 0)

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      {/* Vencidas */}
      <Card className={overdue.length > 0 ? 'border-red-200' : ''}>
        <CardHeader>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className={`h-4 w-4 ${overdue.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              Cuotas vencidas
            </div>
            <span className='text-sm font-semibold'>
              {overdue.length}
              {overdue.length > 0 && (
                <span className='ml-2 text-muted-foreground'>
                  ({formatCurrency(totalOverdueAmount)})
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueQuery.isLoading ? (
            <div className='flex justify-center py-4'>
              <Loader />
            </div>
          ) : overdue.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Sin cuotas vencidas. ✓
            </p>
          ) : (
            <ul className='space-y-2 max-h-72 overflow-y-auto'>
              {overdue.slice(0, 10).map((i, idx) => (
                <li key={`${i.accountId}-${i.transactionId}-${i.number}-${idx}`}>
                  <Link
                    to={`/accounts-payable/${i.accountId}`}
                    className='flex items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted text-sm'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='font-medium truncate'>{i.customerName}</div>
                      <div className='text-xs text-muted-foreground'>
                        Cuota {i.number} · {i.planLabel} · venció {formatDate(i.dueDate)} ({i.daysPastDue}d)
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold text-red-700 tabular-nums'>
                        {formatCurrency(i.pendingAmount)}
                      </span>
                      <ArrowRight className='h-3.5 w-3.5 text-muted-foreground' />
                    </div>
                  </Link>
                </li>
              ))}
              {overdue.length > 10 && (
                <li className='text-center text-xs text-muted-foreground pt-1'>
                  + {overdue.length - 10} cuotas vencidas más
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Próximas 7 días */}
      <Card className={upcoming.length > 0 ? 'border-amber-200' : ''}>
        <CardHeader>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center gap-2'>
              <CalendarClock className={`h-4 w-4 ${upcoming.length > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
              Próximas a vencer (7 días)
            </div>
            <span className='text-sm font-semibold'>
              {upcoming.length}
              {upcoming.length > 0 && (
                <span className='ml-2 text-muted-foreground'>
                  ({formatCurrency(totalUpcomingAmount)})
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingQuery.isLoading ? (
            <div className='flex justify-center py-4'>
              <Loader />
            </div>
          ) : upcoming.length === 0 ? (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Sin cuotas próximas a vencer.
            </p>
          ) : (
            <ul className='space-y-2 max-h-72 overflow-y-auto'>
              {upcoming.slice(0, 10).map((i, idx) => (
                <li key={`${i.accountId}-${i.transactionId}-${i.number}-${idx}`}>
                  <Link
                    to={`/accounts-payable/${i.accountId}`}
                    className='flex items-center justify-between gap-2 rounded-md border p-2 hover:bg-muted text-sm'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='font-medium truncate'>{i.customerName}</div>
                      <div className='text-xs text-muted-foreground'>
                        Cuota {i.number} · {i.planLabel} · vence {formatDate(i.dueDate)}{' '}
                        {i.daysToDue === 0 ? '(hoy)' : `(en ${i.daysToDue}d)`}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-semibold tabular-nums'>
                        {formatCurrency(i.pendingAmount)}
                      </span>
                      <ArrowRight className='h-3.5 w-3.5 text-muted-foreground' />
                    </div>
                  </Link>
                </li>
              ))}
              {upcoming.length > 10 && (
                <li className='text-center text-xs text-muted-foreground pt-1'>
                  + {upcoming.length - 10} cuotas más
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InstallmentsWidgets
