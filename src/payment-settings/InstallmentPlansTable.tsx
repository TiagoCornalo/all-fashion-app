import { useEffect, useState } from 'react'
import { Plus, Trash, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Loader
} from '../components'
import {
  useInstallmentPlans,
  useUpdateInstallmentPlans
} from '../hooks/useInstallmentPlans'
import { InstallmentPlanOption } from '../types/sale.types'

type Draft = InstallmentPlanOption & { _draftId: string }

const newDraft = (): Draft => ({
  _draftId: Math.random().toString(36).slice(2),
  installments: 1,
  interestRate: 0,
  label: '',
  isActive: true
})

const InstallmentPlansTable = () => {
  const { data, isLoading } = useInstallmentPlans()
  const updateMut = useUpdateInstallmentPlans()
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    if (data?.plans) {
      setDrafts(
        data.plans.map((p) => ({
          _draftId: Math.random().toString(36).slice(2),
          installments: p.installments,
          interestRate: p.interestRate,
          label: p.label || '',
          isActive: p.isActive !== false
        }))
      )
    }
  }, [data?.plans])

  const handleChange = (id: string, key: keyof InstallmentPlanOption, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => (d._draftId === id ? { ...d, [key]: value } : d))
    )
  }

  const handleAdd = () => setDrafts((prev) => [...prev, newDraft()])

  const handleRemove = (id: string) =>
    setDrafts((prev) => prev.filter((d) => d._draftId !== id))

  const handleSave = async () => {
    const plans: InstallmentPlanOption[] = drafts
      .filter((d) => d.installments >= 1)
      .map((d) => ({
        installments: Math.max(1, Math.floor(Number(d.installments) || 1)),
        interestRate: Math.max(0, Number(d.interestRate) || 0),
        label: d.label?.trim() || `${d.installments} cuotas`,
        isActive: d.isActive !== false
      }))
    try {
      await updateMut.mutateAsync(plans)
      toast.success('Planes de cuotas actualizados')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al guardar planes')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Planes de cuotas (cuenta corriente)</CardTitle>
          <Button
            onClick={handleSave}
            size='sm'
            disabled={updateMut.isPending}
          >
            <Save className='mr-1 h-4 w-4' />
            {updateMut.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          El recargo se suma al subtotal de la venta cuando el cliente acepta el plan.
          La periodicidad por defecto se define en cada cuenta corriente.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex justify-center py-6'>
            <Loader />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left'>
                  <th className='py-2 pr-2'>Cantidad de cuotas</th>
                  <th className='py-2 px-2'>% Recargo</th>
                  <th className='py-2 px-2'>Etiqueta (visible al vendedor)</th>
                  <th className='py-2 px-2'>Activo</th>
                  <th className='py-2 pl-2 text-right'></th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d._draftId} className='border-b last:border-b-0'>
                    <td className='py-2 pr-2'>
                      <Input
                        type='number'
                        min={1}
                        max={48}
                        className='w-20 h-8'
                        value={d.installments}
                        onChange={(e) =>
                          handleChange(d._draftId, 'installments', Number(e.target.value))
                        }
                      />
                    </td>
                    <td className='py-2 px-2'>
                      <Input
                        type='number'
                        min={0}
                        max={100}
                        step='0.1'
                        className='w-20 h-8'
                        value={d.interestRate}
                        onChange={(e) =>
                          handleChange(d._draftId, 'interestRate', Number(e.target.value))
                        }
                      />
                    </td>
                    <td className='py-2 px-2'>
                      <Input
                        className='h-8'
                        value={d.label}
                        onChange={(e) => handleChange(d._draftId, 'label', e.target.value)}
                        placeholder='Ej. 3 cuotas sin interés'
                      />
                    </td>
                    <td className='py-2 px-2'>
                      <input
                        type='checkbox'
                        checked={d.isActive !== false}
                        onChange={(e) =>
                          handleChange(d._draftId, 'isActive', e.target.checked)
                        }
                      />
                    </td>
                    <td className='py-2 pl-2 text-right'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleRemove(d._draftId)}
                      >
                        <Trash className='h-3.5 w-3.5' />
                      </Button>
                    </td>
                  </tr>
                ))}
                {drafts.length === 0 && (
                  <tr>
                    <td colSpan={5} className='py-6 text-center text-muted-foreground'>
                      No hay planes definidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className='mt-3'>
          <Button onClick={handleAdd} variant='outline' size='sm'>
            <Plus className='mr-1 h-4 w-4' />
            Agregar plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default InstallmentPlansTable
