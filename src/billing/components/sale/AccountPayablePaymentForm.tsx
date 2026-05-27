import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../../../components'
import { toast } from 'react-toastify'
import { User, Search, Loader2, CheckCircle, CalendarClock } from 'lucide-react'
import { accountsPayableService, AccountPayable } from '../../../services/accountsPayable.service'
import { useInstallmentPlans } from '../../../hooks/useInstallmentPlans'
import { useSaleStore } from '../../../stores/saleStore'
import { InstallmentFrequency } from '../../../types/sale.types'

const FREQ_DAYS: Record<InstallmentFrequency, number> = {
  WEEKLY: 7,
  BIWEEKLY: 15,
  MONTHLY: 30
}

const FREQ_LABEL: Record<InstallmentFrequency, string> = {
  WEEKLY: 'semanal',
  BIWEEKLY: 'quincenal',
  MONTHLY: 'mensual'
}

const formatArs = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

const formatDate = (d: Date) =>
  d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

interface AccountPayablePaymentFormProps {
  onDataChange: (data: {
    accountPayableId?: string
    installmentPlanIndex?: number | null
    installmentFrequencyOverride?: InstallmentFrequency
    customerInfo?: {
      name: string
      documentType: 'DNI' | 'CUIT'
      documentNumber: string
      phone?: string
      email?: string
    }
  }) => void
  disabled?: boolean
}

interface SearchForm {
  documentNumber: string
}

interface CustomerForm {
  name: string
  documentType: 'DNI' | 'CUIT'
  documentNumber: string
  phone: string
  email: string
}

/**
 * Componente para manejar datos de cuenta corriente en el pago
 */
export const AccountPayablePaymentForm = ({
  onDataChange,
  disabled = false
}: AccountPayablePaymentFormProps) => {
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [planIndex, setPlanIndex] = useState<number | null>(null)
  const [frequencyOverride, setFrequencyOverride] = useState<InstallmentFrequency | ''>('')

  const { data: plansData } = useInstallmentPlans()
  const plans = plansData?.plans ?? []
  const defaultFrequency = plansData?.defaultFrequency ?? 'MONTHLY'
  const accountFrequency = (selectedAccount?.paymentTerms?.frequency as InstallmentFrequency | undefined) || defaultFrequency
  const effectiveFrequency = (frequencyOverride || accountFrequency) as InstallmentFrequency

  const saleSubtotal = useSaleStore((s) => s.total)
  const selectedPlan = planIndex !== null ? plans[planIndex] : null

  // Preview de cuotas con la info elegida
  const installmentPreview = (() => {
    if (!selectedPlan || saleSubtotal <= 0) return null
    const interest = saleSubtotal * (selectedPlan.interestRate || 0) / 100
    const totalWithInterest = saleSubtotal + interest
    const periodDays = FREQ_DAYS[effectiveFrequency] || 30
    const installments: Array<{ number: number; amount: number; dueDate: Date }> = []
    const perInstallment = Math.round((totalWithInterest / selectedPlan.installments) * 100) / 100
    let assigned = 0
    for (let i = 1; i <= selectedPlan.installments; i++) {
      const due = new Date()
      due.setDate(due.getDate() + periodDays * i)
      const amount =
        i === selectedPlan.installments
          ? Math.round((totalWithInterest - assigned) * 100) / 100
          : perInstallment
      assigned += amount
      installments.push({ number: i, amount, dueDate: due })
    }
    return {
      interest: Math.round(interest * 100) / 100,
      totalWithInterest: Math.round(totalWithInterest * 100) / 100,
      installments
    }
  })()

  // Form para buscar cuenta
  const searchForm = useForm<SearchForm>({
    defaultValues: {
      documentNumber: ''
    }
  })

  // Form para crear nueva cuenta
  const customerForm = useForm<CustomerForm>({
    defaultValues: {
      name: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: ''
    }
  })

  // Query para buscar cuenta por documento
  const { data: foundAccount, isLoading: isSearching, refetch: searchAccount } = useQuery({
    queryKey: ['account-by-document', searchForm.watch('documentNumber')],
    queryFn: () => {
      const docNumber = searchForm.getValues('documentNumber')
      if (!docNumber || docNumber.length < 7) return null
      return accountsPayableService.getAccountByDocument(docNumber)
    },
    enabled: false,
    retry: false
  })

  const handleSearchAccount = async () => {
    const docNumber = searchForm.getValues('documentNumber')
    if (!docNumber || docNumber.length < 7) {
      toast.error('Ingrese un número de documento válido')
      return
    }
    await searchAccount()
  }

  const handleSelectAccount = (account: AccountPayable) => {
    setSelectedAccount(account)
    setShowCreateForm(false)
    onDataChange({
      accountPayableId: account._id,
      installmentPlanIndex: planIndex,
      installmentFrequencyOverride: frequencyOverride || undefined
    })
  }

  // Propagar el plan/frecuencia al store cuando cambian
  useEffect(() => {
    if (!selectedAccount && !showCreateForm) return
    const base = selectedAccount
      ? { accountPayableId: selectedAccount._id }
      : { customerInfo: customerForm.getValues() && {
          name: customerForm.getValues('name'),
          documentType: customerForm.getValues('documentType'),
          documentNumber: customerForm.getValues('documentNumber'),
          phone: customerForm.getValues('phone') || undefined,
          email: customerForm.getValues('email') || undefined
        } }
    onDataChange({
      ...base,
      installmentPlanIndex: planIndex,
      installmentFrequencyOverride: frequencyOverride || undefined
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIndex, frequencyOverride])

  const handleCustomerFormChange = () => {
    const formData = customerForm.getValues()
    if (formData.name && formData.documentNumber) {
      onDataChange({
        customerInfo: {
          name: formData.name,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          phone: formData.phone || undefined,
          email: formData.email || undefined
        }
      })
    }
  }

  const handleClear = () => {
    setSelectedAccount(null)
    setShowCreateForm(false)
    searchForm.reset()
    customerForm.reset()
    onDataChange({})
  }

  if (selectedAccount) {
    return (
      <div className='space-y-3'>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {selectedAccount.customer.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedAccount.customer.documentType}: {selectedAccount.customer.documentNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Balance: ${selectedAccount.currentBalance.toLocaleString()} |
                  Límite: ${selectedAccount.creditLimit.toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleClear} disabled={disabled}>
                Cambiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <InstallmentPicker
          plans={plans}
          planIndex={planIndex}
          onPlanChange={setPlanIndex}
          frequency={effectiveFrequency}
          accountDefaultFrequency={accountFrequency}
          frequencyOverride={frequencyOverride}
          onFrequencyChange={setFrequencyOverride}
          preview={installmentPreview}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cuenta Corriente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showCreateForm ? (
          <>
            {/* Buscar cuenta existente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Search className="h-4 w-4" />
                Buscar Cuenta Existente
              </div>

              <Form {...searchForm}>
                <div className="flex gap-2">
                  <FormField
                    control={searchForm.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Número de documento (DNI/CUIT)"
                            disabled={disabled}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    onClick={handleSearchAccount}
                    disabled={isSearching || disabled}
                    size="sm"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Form>

              {foundAccount && (
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{foundAccount.customer.name}</h4>
                      <p className="text-sm text-gray-600">
                        {foundAccount.customer.documentType}: {foundAccount.customer.documentNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: ${foundAccount.currentBalance.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSelectAccount(foundAccount)}
                      disabled={disabled}
                    >
                      Seleccionar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Crear nuevo cliente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Crear Nuevo Cliente
              </div>

              <Form {...customerForm}>
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={customerForm.control}
                    name="name"
                    rules={{ required: "El nombre es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Cliente *</FormLabel>
                        <FormControl>
                          <Input
                            disabled={disabled}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleCustomerFormChange()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={customerForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo Doc. *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleCustomerFormChange()
                            }}
                            value={field.value}
                            disabled={disabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DNI">DNI</SelectItem>
                              <SelectItem value="CUIT">CUIT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={customerForm.control}
                      name="documentNumber"
                      rules={{ required: "El documento es requerido" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número *</FormLabel>
                          <FormControl>
                            <Input
                              disabled={disabled}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e)
                                handleCustomerFormChange()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={customerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input
                            disabled={disabled}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleCustomerFormChange()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>

              <div className="text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={disabled}
                  size="sm"
                >
                  Buscar Existente
                </Button>
              </div>
            </div>
          </>
        )}

        {(showCreateForm || foundAccount) && (
          <InstallmentPicker
            plans={plans}
            planIndex={planIndex}
            onPlanChange={setPlanIndex}
            frequency={effectiveFrequency}
            accountDefaultFrequency={accountFrequency}
            frequencyOverride={frequencyOverride}
            onFrequencyChange={setFrequencyOverride}
            preview={installmentPreview}
            disabled={disabled}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface InstallmentPickerProps {
  plans: Array<{ installments: number; interestRate: number; label?: string }>
  planIndex: number | null
  onPlanChange: (idx: number | null) => void
  frequency: InstallmentFrequency
  accountDefaultFrequency: InstallmentFrequency
  frequencyOverride: InstallmentFrequency | ''
  onFrequencyChange: (f: InstallmentFrequency | '') => void
  preview: {
    interest: number
    totalWithInterest: number
    installments: Array<{ number: number; amount: number; dueDate: Date }>
  } | null
  disabled?: boolean
}

const InstallmentPicker = ({
  plans,
  planIndex,
  onPlanChange,
  frequency,
  accountDefaultFrequency,
  frequencyOverride,
  onFrequencyChange,
  preview,
  disabled
}: InstallmentPickerProps) => {
  if (plans.length === 0) {
    return (
      <div className='rounded-md border border-dashed p-3 text-xs text-amber-700'>
        No hay planes de cuotas cargados. Cargá los planes desde "Configuración de pagos" o el cliente paga en un único pago.
      </div>
    )
  }

  return (
    <Card className='border-dashed'>
      <CardContent className='pt-4 space-y-3'>
        <div className='flex items-center gap-2 text-sm font-medium'>
          <CalendarClock className='h-4 w-4' />
          Plan de cuotas
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <div>
            <label className='text-xs font-medium'>Plan</label>
            <select
              className='w-full rounded-md border bg-background px-2 py-2 text-sm'
              value={planIndex ?? ''}
              onChange={(e) => onPlanChange(e.target.value === '' ? null : Number(e.target.value))}
              disabled={disabled}
            >
              <option value=''>— Sin plan / pago único —</option>
              {plans.map((p, idx) => (
                <option key={idx} value={idx}>
                  {p.label || `${p.installments} cuotas`}
                  {p.interestRate > 0 ? ` (+${p.interestRate}%)` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className='text-xs font-medium'>
              Periodicidad{' '}
              <span className='text-muted-foreground font-normal'>
                (default cuenta: {FREQ_LABEL[accountDefaultFrequency]})
              </span>
            </label>
            <select
              className='w-full rounded-md border bg-background px-2 py-2 text-sm'
              value={frequencyOverride}
              onChange={(e) => onFrequencyChange(e.target.value as InstallmentFrequency | '')}
              disabled={disabled || planIndex === null}
            >
              <option value=''>Usar default ({FREQ_LABEL[accountDefaultFrequency]})</option>
              <option value='WEEKLY'>Semanal (cada 7 días)</option>
              <option value='BIWEEKLY'>Quincenal (cada 15 días)</option>
              <option value='MONTHLY'>Mensual (cada 30 días)</option>
            </select>
          </div>
        </div>

        {preview && (
          <div className='rounded-md bg-amber-50 p-3 text-xs space-y-1'>
            {preview.interest > 0 && (
              <div className='flex justify-between'>
                <span>Interés:</span>
                <span className='font-medium'>+{formatArs(preview.interest)}</span>
              </div>
            )}
            <div className='flex justify-between font-medium border-t pt-1 mt-1'>
              <span>Total a pagar por el cliente:</span>
              <span>{formatArs(preview.totalWithInterest)}</span>
            </div>
            <div className='mt-2 space-y-0.5'>
              <div className='text-muted-foreground'>Cuotas ({FREQ_LABEL[frequency]}):</div>
              {preview.installments.map((inst) => (
                <div key={inst.number} className='flex justify-between pl-3'>
                  <span>Cuota {inst.number} — vence {formatDate(inst.dueDate)}</span>
                  <span className='font-medium'>{formatArs(inst.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AccountPayablePaymentForm