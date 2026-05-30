import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../../components'
import { toast } from 'react-toastify'
import {
  accountsPayableService,
  AccountPayable,
  UpdateAccountData
} from '../../../services/accountsPayable.service'
import { Loader2, User, CreditCard, FileText, Settings } from 'lucide-react'

interface EditAccountFormProps {
  account: AccountPayable
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  // Customer data
  customerName: string
  documentType: 'DNI' | 'CUIT'
  documentNumber: string
  phone: string
  email: string

  // Address fields
  street: string
  city: string
  state: string
  postalCode: string

  // Account settings
  creditLimit: number
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'OVERDUE'
  notes: string
  internalNotes: string
}

/**
 * Formulario para editar cuenta corriente existente
 */
export const EditAccountForm = ({ account, onSuccess, onCancel }: EditAccountFormProps) => {
  const [step, setStep] = useState(1)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    defaultValues: {
      customerName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      creditLimit: 0,
      frequency: 'MONTHLY',
      status: 'ACTIVE',
      notes: '',
      internalNotes: ''
    }
  })

  // Cargar datos de la cuenta al montar el componente o cuando cambien los datos
  useEffect(() => {
    if (account && account.customer) {
      setTimeout(() => {
        form.setValue('customerName', account.customer.name || '')
        form.setValue('documentType', (account.customer.documentType as 'DNI' | 'CUIT') || 'DNI')
        form.setValue('documentNumber', account.customer.documentNumber || '')
        form.setValue('phone', account.customer.phone || '')
        form.setValue('email', account.customer.email || '')

        form.setValue('street', account.customer.address?.street || '')
        form.setValue('city', account.customer.address?.city || '')
        form.setValue('state', account.customer.address?.state || '')
        form.setValue('postalCode', account.customer.address?.postalCode || '')

        form.setValue('creditLimit', Number(account.creditLimit) || 0)
        form.setValue(
          'frequency',
          (account.paymentTerms?.frequency as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY') || 'MONTHLY'
        )

        form.setValue('status', (account.status as 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'OVERDUE') || 'ACTIVE')
        form.setValue('notes', account.notes || '')
        form.setValue('internalNotes', account.internalNotes || '')

        setIsFormInitialized(true)
      }, 0)
    }
  }, [account, form])

  const updateAccountMutation = useMutation({
    mutationFn: (data: UpdateAccountData) =>
      accountsPayableService.updateAccount(account._id, data),
    onSuccess: () => {
      toast.success('La cuenta se ha actualizado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['account-detail', account._id] })
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar cuenta: ${error.message}`)
    }
  })

  const onSubmit = (data: FormData) => {
    // Construir objeto de dirección solo si hay datos
    const hasAddressData = data.street.trim() || data.city.trim() || data.state.trim() || data.postalCode.trim()

    const customerData: UpdateAccountData['customer'] = {
      name: data.customerName,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      phone: data.phone || undefined,
      email: data.email || undefined
    }

    if (hasAddressData) {
      customerData.address = {
        street: data.street || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || ''
      }
    }

    const updateData: UpdateAccountData = {
      customer: {
        ...customerData
      },
      creditLimit: data.creditLimit,
      paymentTerms: {
        days: account.paymentTerms?.days || 30,            // legacy preservado
        interestRate: account.paymentTerms?.interestRate || 0, // legacy preservado
        frequency: data.frequency || 'MONTHLY'
      },
      status: data.status,
      notes: data.notes || undefined,
      internalNotes: data.internalNotes || undefined
    }

    updateAccountMutation.mutate(updateData)
  }

  const handleNextStep = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir comportamiento por defecto y propagación
    e?.preventDefault()
    e?.stopPropagation()

    // Validar campos del paso actual
    const fieldsToValidate = step === 1
      ? ['customerName' as const, 'documentType' as const, 'documentNumber' as const]
      : step === 2
        ? ['creditLimit' as const, 'frequency' as const]
        : ['status' as const]

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setStep(step + 1)
    }
  }

  // Mostrar loading mientras el formulario no esté inicializado
  if (!isFormInitialized) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Inicializando formulario...
          </h3>
          <p className="text-gray-600">
            Cargando datos de la cuenta
          </p>
        </div>
      </div>
    )
  }

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            key="customerName-field"
            control={form.control}
            name="customerName"
            rules={{
              required: "El nombre del cliente es requerido",
              minLength: { value: 2, message: "El nombre debe tener al menos 2 caracteres" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Cliente *</FormLabel>
                <FormControl>
                  <Input key="customerName-input" placeholder="Nombre completo o razón social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="documentType-field"
            control={form.control}
            name="documentType"
            rules={{ required: "El tipo de documento es requerido" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger key="documentType-select">
                      <SelectValue placeholder="Seleccionar tipo" />
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
            key="documentNumber-field"
            control={form.control}
            name="documentNumber"
            rules={{
              required: "El número de documento es requerido",
              pattern: {
                value: /^[0-9]+$/,
                message: "Solo se permiten números"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Documento *</FormLabel>
                <FormControl>
                  <Input key="documentNumber-input" placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="phone-field"
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input key="phone-input" placeholder="+54 11 1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="email-field"
            control={form.control}
            name="email"
            rules={{
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input key="email-input" type="email" placeholder="cliente@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="street-field"
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input key="street-input" placeholder="Calle y número" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="city-field"
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input key="city-input" placeholder="Corrientes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="state-field"
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl>
                  <Input key="state-input" placeholder="Corrientes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="postalCode-field"
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input key="postalCode-input" placeholder="3400" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Configuración de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            key="creditLimit-field"
            control={form.control}
            name="creditLimit"
            rules={{
              required: "El límite de crédito es requerido",
              min: { value: 0, message: "El límite debe ser mayor o igual a 0" }
            }}
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Límite de Crédito *</FormLabel>
                  <FormControl>
                    <Input
                      key="creditLimit-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value === null || field.value === undefined ? '' : String(field.value)}
                      onChange={(e) => {
                        const value = e.target.value
                        // Permitir string vacío temporalmente mientras edita
                        if (value === '') {
                          field.onChange('')
                        } else {
                          const numValue = parseFloat(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue)
                          } else if (value === '0' || value.startsWith('0.') || value.startsWith('0,')) {
                            // Permitir escribir "0", "0." o "0," al principio
                            field.onChange(value)
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // En onBlur, convertir string vacío a 0
                        const value = e.target.value
                        if (value === '' || value === null || value === undefined) {
                          field.onChange(0)
                        } else {
                          // Convertir a número si es string
                          const numValue = parseFloat(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue)
                          } else {
                            field.onChange(0)
                          }
                        }
                        field.onBlur()
                      }}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )
            }}
          />

          <FormField
            key='frequency-field'
            control={form.control}
            name='frequency'
            rules={{ required: 'La periodicidad es requerida' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periodicidad por defecto de cuotas *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'MONTHLY'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Elegir periodicidad' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='WEEKLY'>Semanal (cada 7 días)</SelectItem>
                    <SelectItem value='BIWEEKLY'>Quincenal (cada 15 días)</SelectItem>
                    <SelectItem value='MONTHLY'>Mensual (cada 30 días)</SelectItem>
                  </SelectContent>
                </Select>
                <p className='text-[10px] text-muted-foreground mt-1'>
                  Default al armar el plan de cuotas en cada venta. La tasa de interés
                  se configura por plan en <strong>Configuración de pagos</strong>.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Estado y Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            key="status-field"
            control={form.control}
            name="status"
            rules={{ required: "El estado es requerido" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de la Cuenta *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger key="status-select">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activa</SelectItem>
                    <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                    <SelectItem value="CLOSED">Cerrada</SelectItem>
                    <SelectItem value="OVERDUE">Vencida</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notas y Comentarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            key="notes-field"
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Públicas</FormLabel>
                <FormControl>
                  <Textarea
                    key="notes-textarea"
                    placeholder="Comentarios visibles para el cliente..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            key="internalNotes-field"
            control={form.control}
            name="internalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl>
                  <Textarea
                    key="internalNotes-textarea"
                    placeholder="Comentarios internos solo para el equipo..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Indicador de pasos */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
              1
            </div>
            <span className="ml-2 font-medium">Cliente</span>
          </div>

          <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
              2
            </div>
            <span className="ml-2 font-medium">Crédito</span>
          </div>

          <div className={`w-12 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
              3
            </div>
            <span className="ml-2 font-medium">Estado</span>
          </div>
        </div>

        {/* Contenido del paso */}
        {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}

        {/* Botones de navegación */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="space-x-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={form.formState.isSubmitting}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={updateAccountMutation.isPending || form.formState.isSubmitting}
              >
                {(updateAccountMutation.isPending || form.formState.isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar Cuenta
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
