import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  FormMessage,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../components'
import { toast } from 'react-toastify'
import { CreditCard, User, Plus, Search, Loader2 } from 'lucide-react'
import { accountsPayableService, Customer } from '../../services/accountsPayable.service'

interface SaleAccountsPayableProps {
  saleId: string
  saleTotal: number
  saleItems: Array<{
    product: {
      _id: string
      name: string
    }
    quantity: number
    price?: number
    subtotal?: number
  }>
  invoice?: {
    number?: string
    type?: string
  }
}

interface SearchAccountForm {
  documentNumber: string
}

interface CreateAccountForm {
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
  paymentDays: number
  interestRate: number
}

/**
 * Componente para cargar ventas a cuentas corrientes
 */
export const SaleAccountsPayable = ({
  saleId,
  saleTotal,
  saleItems,
  invoice
}: SaleAccountsPayableProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  // Form para buscar cuenta por documento
  const searchForm = useForm<SearchAccountForm>({
    defaultValues: {
      documentNumber: ''
    }
  })

  // Form para crear nueva cuenta
  const createForm = useForm<CreateAccountForm>({
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
      paymentDays: 30,
      interestRate: 5
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

  // Mutation para crear cuenta
  const createAccountMutation = useMutation({
    mutationFn: (data: CreateAccountForm) => {
      const customerData: Customer = {
        name: data.customerName,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: (data.street || data.city || data.state || data.postalCode) ? {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || ''
        } : undefined
      }

      return accountsPayableService.createAccount({
        customer: customerData,
        creditLimit: data.creditLimit,
        paymentTerms: {
          days: data.paymentDays,
          interestRate: data.interestRate / 100
        }
      })
    },
    onSuccess: (account) => {
      toast.success('Cuenta corriente creada exitosamente')
      setSelectedAccountId(account._id)
      setShowCreateAccount(false)
      createForm.reset()
    },
    onError: (error: Error) => {
      toast.error(`Error al crear cuenta: ${error.message}`)
    }
  })

  // Mutation para registrar venta en cuenta corriente
  const registerSaleMutation = useMutation({
    mutationFn: () => {
      if (showCreateAccount) {
        // Crear cuenta nueva y registrar venta
        return createAccountMutation.mutateAsync(createForm.getValues()).then(() => {
          const customerData: Customer = {
            name: createForm.getValues('customerName'),
            documentType: createForm.getValues('documentType'),
            documentNumber: createForm.getValues('documentNumber'),
            phone: createForm.getValues('phone') || undefined,
            email: createForm.getValues('email') || undefined
          }

          return accountsPayableService.registerExistingSaleToAccount(saleId, {
            createAccount: true,
            customerData
          })
        })
      } else {
        // Usar cuenta existente
        if (!selectedAccountId) {
          throw new Error('Debe seleccionar una cuenta')
        }
        return accountsPayableService.registerExistingSaleToAccount(saleId, {
          accountId: selectedAccountId
        })
      }
    },
    onSuccess: (result) => {
      toast.success(`Venta registrada en cuenta de ${result.account.customerName}`)
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] })
      queryClient.invalidateQueries({ queryKey: ['account-detail', result.account.id] })
      setIsDialogOpen(false)
      setSelectedAccountId('')
      setShowCreateAccount(false)
      searchForm.reset()
      createForm.reset()
    },
    onError: (error: Error) => {
      toast.error(`Error al registrar venta: ${error.message}`)
    }
  })

  const handleSearchAccount = async () => {
    const docNumber = searchForm.getValues('documentNumber')
    if (!docNumber || docNumber.length < 7) {
      toast.error('Ingrese un número de documento válido')
      return
    }
    await searchAccount()
  }

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId)
    setShowCreateAccount(false)
  }

  const handleCreateNewAccount = () => {
    setShowCreateAccount(true)
    setSelectedAccountId('')

    // Pre-llenar el documento si se buscó uno
    const searchedDoc = searchForm.getValues('documentNumber')
    if (searchedDoc) {
      createForm.setValue('documentNumber', searchedDoc)
    }
  }

  const handleRegisterSale = () => {
    if (!showCreateAccount && !selectedAccountId) {
      toast.error('Debe seleccionar una cuenta o crear una nueva')
      return
    }

    if (showCreateAccount) {
      const isFormValid = createForm.formState.isValid
      if (!isFormValid) {
        toast.error('Complete todos los campos requeridos')
        return
      }
    }

    registerSaleMutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
          Cuenta Corriente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Registrar esta venta en una cuenta corriente existente o crear una nueva
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full text-xs sm:text-sm">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Cargar a Cuenta Corriente
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-xl sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-base sm:text-lg">Cargar Venta a Cuenta Corriente</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-auto space-y-4 sm:space-y-6">
              {/* Información de la venta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base">Información de la Venta</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="font-medium">Total:</span> ${saleTotal.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Productos:</span> {saleItems.length}
                    </div>
                    {invoice?.number && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="font-medium">Factura:</span> {invoice.type} {invoice.number}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Buscar cuenta existente */}
              {!showCreateAccount && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                      Buscar Cuenta Existente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <Form {...searchForm}>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <FormField
                          control={searchForm.control}
                          name="documentNumber"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  placeholder="Número de documento (DNI/CUIT)"
                                  className="text-sm"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          onClick={handleSearchAccount}
                          disabled={isSearching}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          {isSearching ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </div>
                    </Form>

                    {foundAccount && (
                      <div className="border rounded-lg p-3 bg-green-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm sm:text-base truncate">{foundAccount.customer.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {foundAccount.customer.documentType}: {foundAccount.customer.documentNumber}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Balance: ${foundAccount.currentBalance.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectAccount(foundAccount._id)}
                            variant={selectedAccountId === foundAccount._id ? "default" : "outline"}
                            className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0"
                          >
                            {selectedAccountId === foundAccount._id ? 'Seleccionada' : 'Seleccionar'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCreateNewAccount}
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Crear Nueva Cuenta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Crear nueva cuenta */}
              {showCreateAccount && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      Crear Nueva Cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...createForm}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        {/* Campos del formulario de crear cuenta */}
                        <FormField
                          control={createForm.control}
                          name="customerName"
                          rules={{ required: "El nombre es requerido" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Nombre del Cliente *</FormLabel>
                              <FormControl>
                                <Input {...field} className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="documentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Tipo de Documento *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-sm">
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
                          control={createForm.control}
                          name="documentNumber"
                          rules={{ required: "El documento es requerido" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Número de Documento *</FormLabel>
                              <FormControl>
                                <Input {...field} className="text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="creditLimit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs sm:text-sm">Límite de Crédito</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="text-sm"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-4 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateAccount(false)}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Botón de acción */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterSale}
                disabled={registerSaleMutation.isPending}
                className="w-full sm:w-auto order-1 sm:order-2 text-xs sm:text-sm"
              >
                {registerSaleMutation.isPending && (
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                )}
                Registrar Venta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}