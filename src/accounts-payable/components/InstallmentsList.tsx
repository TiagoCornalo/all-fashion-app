import { MessageCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '../../components'
import {
  AccountPayable,
  Transaction,
  accountsPayableService
} from '../../services/accountsPayable.service'

type Props = {
  account: AccountPayable
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700'
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Pago parcial',
  PAID: 'Pagada',
  OVERDUE: 'Vencida'
}

const FREQ_LABEL: Record<string, string> = {
  WEEKLY: 'semanal',
  BIWEEKLY: 'quincenal',
  MONTHLY: 'mensual'
}

const formatCurrency = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const InstallmentsList = ({ account }: Props) => {
  const salesWithPlan = account.transactions
    .filter((t) => t.type === 'SALE' && t.installmentPlan && t.installmentPlan.installments?.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (salesWithPlan.length === 0) {
    return (
      <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center'>
        No hay ventas con plan de cuotas en esta cuenta.
      </div>
    )
  }

  const handleSendConditions = async (transaction: Transaction) => {
    try {
      const wa = await accountsPayableService.getWhatsAppForSale(account._id, transaction._id)
      window.open(wa.url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'No se pudo armar el mensaje de WhatsApp')
    }
  }

  return (
    <div className='space-y-4'>
      {salesWithPlan.map((txn) => {
        const plan = txn.installmentPlan!
        const totalPaid = plan.installments.reduce((sum, i) => sum + (i.paidAmount || 0), 0)
        const totalDue = plan.installments.reduce((sum, i) => sum + i.amount, 0)
        const remaining = Math.max(0, totalDue - totalPaid)

        return (
          <div key={txn._id} className='rounded-md border p-3 space-y-2'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1'>
                <div className='text-sm font-medium'>{plan.label || `${plan.count} cuotas`}</div>
                <div className='text-xs text-muted-foreground'>
                  {txn.description} · Periodicidad {FREQ_LABEL[plan.frequency] || 'mensual'}
                </div>
                <div className='text-xs text-muted-foreground'>
                  Total: {formatCurrency(totalDue)} · Pagado: {formatCurrency(totalPaid)} · Resta: {formatCurrency(remaining)}
                </div>
              </div>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleSendConditions(txn)}
              >
                <MessageCircle className='mr-1 h-3.5 w-3.5' />
                WhatsApp
              </Button>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-xs'>
                <thead>
                  <tr className='border-b text-left text-muted-foreground'>
                    <th className='py-1 pr-2'>Cuota</th>
                    <th className='py-1 px-2'>Vencimiento</th>
                    <th className='py-1 px-2 text-right'>Monto</th>
                    <th className='py-1 px-2 text-right'>Pagado</th>
                    <th className='py-1 pl-2'>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.installments.map((inst) => (
                    <tr key={inst.number} className='border-b last:border-b-0'>
                      <td className='py-1 pr-2'>#{inst.number}</td>
                      <td className='py-1 px-2'>{formatDate(inst.dueDate)}</td>
                      <td className='py-1 px-2 text-right tabular-nums'>
                        {formatCurrency(inst.amount)}
                      </td>
                      <td className='py-1 px-2 text-right tabular-nums'>
                        {formatCurrency(inst.paidAmount || 0)}
                      </td>
                      <td className='py-1 pl-2'>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[inst.status] || ''}`}
                        >
                          {STATUS_LABEL[inst.status] || inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default InstallmentsList
