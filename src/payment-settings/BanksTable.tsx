import { useState } from 'react'
import { Pencil, Plus, PowerOff, Power } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loader
} from '../components'
import { Bank } from '../types/sale.types'
import {
  useBanksList,
  useUpdateBank,
  useDeactivateBank
} from '../hooks/useBanks'
import BankFormDialog from './BankFormDialog'

const BanksTable = () => {
  const [showCreate, setShowCreate] = useState(false)
  const [editingBank, setEditingBank] = useState<Bank | null>(null)
  const { data, isLoading } = useBanksList({ page: 1, pageSize: 100 })
  const updateMut = useUpdateBank()
  const deactivateMut = useDeactivateBank()

  const banks = data?.data ?? []

  const handleToggleActive = async (bank: Bank) => {
    try {
      if (bank.isActive) {
        await deactivateMut.mutateAsync(bank._id)
        toast.success(`Banco "${bank.name}" desactivado`)
      } else {
        await updateMut.mutateAsync({ id: bank._id, payload: { isActive: true } })
        toast.success(`Banco "${bank.name}" reactivado`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al cambiar estado')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Bancos y recargos por tarjeta</CardTitle>
          <Button onClick={() => setShowCreate(true)} size='sm'>
            <Plus className='mr-1 h-4 w-4' />
            Nuevo banco
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          El recargo se suma al monto cuando el cliente paga con débito o crédito de ese banco.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex justify-center py-6'>
            <Loader />
          </div>
        ) : banks.length === 0 ? (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            Todavía no hay bancos cargados. Apretá "Nuevo banco" para empezar.
          </p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left'>
                  <th className='py-2 pr-2'>Banco</th>
                  <th className='py-2 px-2 text-right'>Débito</th>
                  <th className='py-2 px-2 text-right'>Crédito</th>
                  <th className='py-2 px-2'>Estado</th>
                  <th className='py-2 pl-2 text-right'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank._id} className='border-b last:border-b-0'>
                    <td className='py-2 pr-2'>
                      <div className='font-medium'>{bank.name}</div>
                      {bank.notes && (
                        <div className='text-xs text-muted-foreground'>{bank.notes}</div>
                      )}
                    </td>
                    <td className='py-2 px-2 text-right tabular-nums'>
                      {bank.surcharges.DEBIT}%
                    </td>
                    <td className='py-2 px-2 text-right tabular-nums'>
                      {bank.surcharges.CREDIT}%
                    </td>
                    <td className='py-2 px-2'>
                      {bank.isActive ? (
                        <span className='inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700'>
                          Activo
                        </span>
                      ) : (
                        <span className='inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700'>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className='py-2 pl-2'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => setEditingBank(bank)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleToggleActive(bank)}
                          title={bank.isActive ? 'Desactivar' : 'Reactivar'}
                        >
                          {bank.isActive ? (
                            <PowerOff className='h-3.5 w-3.5' />
                          ) : (
                            <Power className='h-3.5 w-3.5' />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <BankFormDialog
        isOpen={showCreate}
        onOpenChange={setShowCreate}
        mode='create'
      />
      <BankFormDialog
        isOpen={!!editingBank}
        onOpenChange={(open) => !open && setEditingBank(null)}
        mode='edit'
        bank={editingBank ?? undefined}
      />
    </Card>
  )
}

export default BanksTable
