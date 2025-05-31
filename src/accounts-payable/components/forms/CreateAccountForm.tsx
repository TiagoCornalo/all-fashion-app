import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { accountsPayableService, CreateAccountData } from '../../../services/accountsPayable.service'
import { Loader2, User, CreditCard, FileText } from 'lucide-react'

interface CreateAccountFormProps {
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
  creditLimit: number | string
  paymentDays: number | string
  interestRate: number | string
  notes: string
  internalNotes: string
}

/**
 * Formulario para crear nueva cuenta corriente
 */
export const CreateAccountForm = ({ onSuccess, onCancel }: CreateAccountFormProps) => {
  const [step, setStep] = useState(1)

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
      creditLimit: '',
      paymentDays: '',
      interestRate: '5', // 5% por defecto como string
      notes: '',
      internalNotes: ''
    }
  })

  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountData) => accountsPayableService.createAccount(data),
    onSuccess: () => {
      toast.success('La cuenta corriente se ha creado exitosamente')
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cuenta: ${error.message}`)
    }
  })

  const onSubmit = (data: FormData) => {
    // Construir objeto de dirección solo si hay datos
    const hasAddressData = data.street.trim() || data.city.trim() || data.state.trim() || data.postalCode.trim()

    const accountData: CreateAccountData = {
      customer: {
        name: data.customerName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: hasAddressData ? {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || ''
        } : undefined
      },
      creditLimit: typeof data.creditLimit === 'string' ? parseFloat(data.creditLimit) || 0 : data.creditLimit,
      paymentTerms: {
        days: typeof data.paymentDays === 'string' ? parseInt(data.paymentDays) || 30 : data.paymentDays,
        interestRate: typeof data.interestRate === 'string' ?
          (parseFloat(data.interestRate) || 5) / 100 :
          typeof data.interestRate === 'number' ? data.interestRate : 0.05
      },
      notes: data.notes || undefined,
      internalNotes: data.internalNotes || undefined
    }

    createAccountMutation.mutate(accountData)
  }

  const handleNextStep = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevenir comportamiento por defecto y propagación
    e?.preventDefault()
    e?.stopPropagation()

    // Validar campos del paso actual
    const fieldsToValidate = step === 1
      ? ['customerName' as const, 'documentType' as const, 'documentNumber' as const]
      : ['creditLimit' as const, 'paymentDays' as const, 'interestRate' as const]

    const isValid = await form.trigger(fieldsToValidate)
    if (isValid) {
      setStep(2)
    }
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
                  <Input placeholder="Nombre completo o razón social" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="documentType"
            rules={{ required: "El tipo de documento es requerido" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Documento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
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
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+54 11 1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
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
                  <Input type="email" placeholder="cliente@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input placeholder="Calle y número" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Corrientes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl>
                  <Input placeholder="Corrientes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input placeholder="3400" {...field} />
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
    <div className="space-y-6">
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
              control={form.control}
              name="creditLimit"
              rules={{
                required: "El límite de crédito es requerido",
                min: { value: 0, message: "El límite debe ser mayor o igual a 0" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Límite de Crédito *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange(0)
                        } else {
                          const numValue = parseFloat(value)
                          field.onChange(isNaN(numValue) ? 0 : numValue)
                        }
                      }}
                      onBlur={(e) => {
                        field.onBlur()
                        if (e.target.value === '') {
                          field.onChange(0)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDays"
              rules={{
                required: "Los días de pago son requeridos",
                min: { value: 1, message: "Debe ser al menos 1 día" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días de Pago *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="30"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange('')
                        } else {
                          const numValue = parseInt(value)
                          field.onChange(isNaN(numValue) ? '' : numValue)
                        }
                      }}
                      onBlur={(e) => {
                        field.onBlur()
                        if (e.target.value === '' || parseInt(e.target.value) < 1) {
                          field.onChange(30)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              rules={{
                required: "La tasa de interés es requerida",
                min: { value: 0, message: "La tasa debe ser mayor o igual a 0" },
                max: { value: 100, message: "La tasa no puede ser mayor a 100%" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de Interés (%) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="5.00"
                      {...field}
                      value={
                        field.value === '' ? '' :
                          typeof field.value === 'number' ? (field.value * 100).toString() :
                            field.value
                      }
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          field.onChange('')
                        } else {
                          const numValue = parseFloat(value)
                          if (!isNaN(numValue)) {
                            field.onChange(numValue.toString())
                          }
                        }
                      }}
                      onBlur={(e) => {
                        field.onBlur()
                        if (e.target.value === '') {
                          field.onChange('5') // 5% por defecto como string
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Públicas</FormLabel>
                <FormControl>
                  <Textarea
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
            control={form.control}
            name="internalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas Internas</FormLabel>
                <FormControl>
                  <Textarea
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

          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />

          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}>
              2
            </div>
            <span className="ml-2 font-medium">Configuración</span>
          </div>
        </div>

        {/* Contenido del paso */}
        {step === 1 ? renderStep1() : renderStep2()}

        {/* Botones de navegación */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={step === 1 ? onCancel : () => setStep(1)}
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="space-x-2">
            {step === 1 ? (
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
                disabled={createAccountMutation.isPending || form.formState.isSubmitting}
              >
                {(createAccountMutation.isPending || form.formState.isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Cuenta
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}