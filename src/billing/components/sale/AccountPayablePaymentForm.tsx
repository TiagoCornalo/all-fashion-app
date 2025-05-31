import { useState } from 'react'
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
import { User, Search, Loader2, CheckCircle } from 'lucide-react'
import { accountsPayableService, AccountPayable } from '../../../services/accountsPayable.service'

interface AccountPayablePaymentFormProps {
  onDataChange: (data: {
    accountPayableId?: string
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
      accountPayableId: account._id
    })
  }

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
      </CardContent>
    </Card>
  )
}

export default AccountPayablePaymentForm