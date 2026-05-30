import api from './config/axios'

// ===== INTERFACES PARA CUENTAS CORRIENTES =====

export interface Customer {
  name: string
  documentType: 'DNI' | 'CUIT'
  documentNumber: string
  phone?: string
  email?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
  }
}

export interface PaymentTerms {
  days: number
  interestRate: number
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
}

export interface TransactionInstallment {
  number: number
  amount: number
  dueDate: string
  paidAmount: number
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
  paidAt?: string
}

export interface UpcomingInstallment {
  accountId: string
  customerName: string
  customerPhone: string | null
  transactionId: string
  saleId: string | null
  planLabel: string
  number: number
  dueDate: string
  amount: number
  paidAmount: number
  pendingAmount: number
  daysToDue: number
}

export interface OverdueInstallment {
  accountId: string
  customerName: string
  customerPhone: string | null
  transactionId: string
  saleId: string | null
  planLabel: string
  number: number
  dueDate: string
  amount: number
  paidAmount: number
  pendingAmount: number
  daysPastDue: number
}

export interface TransactionInstallmentPlan {
  count: number
  interestRate: number
  interestAmount: number
  baseAmount: number
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  label?: string
  totalWithInterest?: number
  installments: TransactionInstallment[]
}

export interface PaymentDetails {
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER'
  reference?: string
  cardType?: string
  checkNumber?: string
  bankName?: string
}

export interface SaleDetails {
  invoiceNumber?: string
  invoiceType?: string
  items: Array<{
    productId: string
    productName: string
    productCode: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
}

export interface Transaction {
  _id: string
  type: 'SALE' | 'PAYMENT' | 'ADJUSTMENT' | 'INTEREST' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  amount: number
  description: string
  createdAt: string
  createdBy: {
    name: string
  }
  approvedBy?: {
    name: string
  }
  paymentDetails?: PaymentDetails
  saleDetails?: SaleDetails
  adjustmentReason?: string
  saleId?: string
  installmentPlan?: TransactionInstallmentPlan
}

export interface AccountSummary {
  totalTransactions: number
  totalSales: number
  totalPayments: number
  lastTransactionDate?: string
  daysSinceLastTransaction?: number
  averageMonthlyActivity: number
}

export interface AccountPayable {
  _id: string
  customer: Customer
  creditLimit: number
  currentBalance: number
  overdueAmount: number
  paymentTerms: PaymentTerms
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED' | 'OVERDUE'
  notes?: string
  internalNotes?: string
  createdAt: string
  createdBy: {
    name: string
  }
  lastModifiedBy?: {
    name: string
  }
  transactions: Transaction[]
  summary?: AccountSummary
}

export interface AccountsPayableFilters {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  minBalance?: number
  maxBalance?: number
  hasOverdue?: boolean
  documentType?: string
}

export interface AccountsPayableResponse {
  data: AccountPayable[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    appliedFilters: Record<string, unknown>
    summary: {
      totalBalance: number
      totalOverdue: number
      avgBalance: number
      accountsWithDebt: number
      accountsOverdue: number
    }
    availableStatuses: string[]
    availableDocumentTypes: string[]
  }
}

export interface DashboardSummary {
  accountCounts: {
    total: number
    active: number
    overdue: number
    suspended: number
    closed: number
  }
  financialSummary: {
    totalDebt: number
    totalOverdue: number
    avgBalance: number
    maxDebt: number
    totalCreditLimit: number
    creditUtilization: number
  }
  recentActivity: Record<string, { count: number; totalAmount: number }>
  generatedAt: string
}

export interface CreateAccountData {
  customer: Customer
  creditLimit: number
  paymentTerms: PaymentTerms
  notes?: string
  internalNotes?: string
}

export interface UpdateAccountData extends Partial<CreateAccountData> {
  status?: string
}

export interface AddTransactionData {
  type: 'PAYMENT' | 'ADJUSTMENT' | 'INTEREST' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  amount: number
  description: string
  paymentDetails?: PaymentDetails
  adjustmentReason?: string
  saleId?: string
}

export interface StatementFilters {
  startDate?: string
  endDate?: string
  transactionType?: string
  page?: number
  pageSize?: number
}

export interface CreditCheckResult {
  isApproved: boolean
  availableCredit: number
  requestedAmount: number
  creditLimit: number
  currentBalance: number
  reason?: string
}

export interface DebtorsReportData {
  accounts: AccountPayable[]
  summary: {
    totalDebt: number
    accountCount: number
    averageDebt: number
  }
}

export interface ProcessOverdueResult {
  processedAccounts: number
  newOverdueAccounts: number
  totalOverdueAmount: number
  timestamp: string
}

export interface InvoiceReference {
  number: string
  type: string
  date: string
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

/**
 * Utilitarios para validaciones defensivas
 */
const validateResponse = (response: unknown, operation: string) => {
  if (!response) {
    throw new Error(`No se recibió respuesta del servidor para ${operation}`)
  }

  // Cast to any para evitar problemas de tipos con AxiosResponse
  const axiosResponse = response as { data?: unknown; [key: string]: unknown }

  if (!axiosResponse.data) {
    throw new Error(`Respuesta inválida del servidor para ${operation}`)
  }

  return axiosResponse.data
}

const createDefaultMeta = (dataLength: number = 0) => ({
  total: dataLength,
  page: 1,
  pageSize: 20,
  totalPages: Math.ceil(dataLength / 20),
  appliedFilters: {},
  summary: {
    totalBalance: 0,
    totalOverdue: 0,
    avgBalance: 0,
    accountsWithDebt: 0,
    accountsOverdue: 0
  },
  availableStatuses: ['ACTIVE', 'OVERDUE', 'SUSPENDED', 'CLOSED'],
  availableDocumentTypes: ['DNI', 'CUIT']
})

const createDefaultDashboard = (): DashboardSummary => ({
  accountCounts: {
    total: 0,
    active: 0,
    overdue: 0,
    suspended: 0,
    closed: 0
  },
  financialSummary: {
    totalDebt: 0,
    totalOverdue: 0,
    avgBalance: 0,
    maxDebt: 0,
    totalCreditLimit: 0,
    creditUtilization: 0
  },
  recentActivity: {},
  generatedAt: new Date().toISOString()
})

/**
 * Servicio para manejar cuentas corrientes con validaciones defensivas
 */
class AccountsPayableService {
  /**
   * Obtener resumen del dashboard
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const response = await api.get('/accounts-payable/dashboard/summary')
      const responseData = validateResponse(response, 'obtener resumen del dashboard')

      // Validar estructura del dashboard
      const dashboardData = (responseData as { data?: DashboardSummary }).data

      if (!dashboardData || typeof dashboardData !== 'object') {
        console.warn('Dashboard data is invalid, using defaults')
        return createDefaultDashboard()
      }

      const summary = dashboardData

      // Asegurar que todas las propiedades necesarias existan con valores seguros
      return {
        accountCounts: {
          total: Number(summary.accountCounts?.total) || 0,
          active: Number(summary.accountCounts?.active) || 0,
          overdue: Number(summary.accountCounts?.overdue) || 0,
          suspended: Number(summary.accountCounts?.suspended) || 0,
          closed: Number(summary.accountCounts?.closed) || 0
        },
        financialSummary: {
          totalDebt: Number(summary.financialSummary?.totalDebt) || 0,
          totalOverdue: Number(summary.financialSummary?.totalOverdue) || 0,
          avgBalance: Number(summary.financialSummary?.avgBalance) || 0,
          maxDebt: Number(summary.financialSummary?.maxDebt) || 0,
          totalCreditLimit: Number(summary.financialSummary?.totalCreditLimit) || 0,
          creditUtilization: Number(summary.financialSummary?.creditUtilization) || 0
        },
        recentActivity: summary.recentActivity || {},
        generatedAt: summary.generatedAt || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
      return createDefaultDashboard()
    }
  }

  /**
   * Obtener lista de cuentas corrientes con filtros
   */
  async getAccounts(filters: AccountsPayableFilters = {}): Promise<AccountsPayableResponse> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await api.get(`/accounts-payable?${params.toString()}`)
      const responseData = validateResponse(response, 'obtener cuentas')

      // Cast para TypeScript
      const accountsResponse = responseData as {
        data?: AccountPayable[]
        meta?: {
          total: number
          page: number
          pageSize: number
          totalPages: number
          appliedFilters: Record<string, unknown>
          summary: {
            totalBalance: number
            totalOverdue: number
            avgBalance: number
            accountsWithDebt: number
            accountsOverdue: number
          }
          availableStatuses: string[]
          availableDocumentTypes: string[]
        }
      }

      // Validar que la respuesta tenga la estructura esperada
      const accounts = Array.isArray(accountsResponse.data) ? accountsResponse.data : []
      const meta = accountsResponse.meta || createDefaultMeta(accounts.length)

      return {
        data: accounts,
        meta: {
          ...createDefaultMeta(accounts.length),
          ...meta,
          total: Number(meta.total) || accounts.length
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      // Retornar estructura válida en caso de error
      return {
        data: [],
        meta: createDefaultMeta(0)
      }
    }
  }

  /**
   * Obtener detalles de una cuenta específica
   */
  async getAccountById(id: string): Promise<AccountPayable> {
    if (!id || typeof id !== 'string') {
      throw new Error('ID de cuenta inválido')
    }

    try {
      const response = await api.get(`/accounts-payable/${id}`)
      const responseData = validateResponse(response, 'obtener cuenta por ID')

      // El backend devuelve { data: account, meta: ... }
      // Necesitamos extraer la cuenta de responseData.data
      const accountData = (responseData as { data?: AccountPayable }).data

      if (!accountData) {
        throw new Error('Cuenta no encontrada')
      }

      return accountData
    } catch (error) {
      console.error(`Error fetching account ${id}:`, error)
      throw error
    }
  }

  /**
   * Crear nueva cuenta corriente
   */
  async createAccount(accountData: CreateAccountData): Promise<AccountPayable> {
    if (!accountData || !accountData.customer?.name) {
      throw new Error('Datos de cuenta inválidos')
    }

    try {
      const response = await api.post('/accounts-payable', accountData)
      const responseData = validateResponse(response, 'crear cuenta')

      const accountResult = (responseData as { data?: AccountPayable }).data

      if (!accountResult) {
        throw new Error('Error al crear la cuenta')
      }

      return accountResult
    } catch (error) {
      console.error('Error creating account:', error)
      throw error
    }
  }

  /**
   * Actualizar cuenta corriente
   */
  async updateAccount(id: string, accountData: UpdateAccountData): Promise<AccountPayable> {
    if (!id || !accountData) {
      throw new Error('Parámetros inválidos para actualizar cuenta')
    }

    try {
      const response = await api.put(`/accounts-payable/${id}`, accountData)
      const responseData = validateResponse(response, 'actualizar cuenta')

      const accountResult = (responseData as { data?: AccountPayable }).data

      if (!accountResult) {
        throw new Error('Error al actualizar la cuenta')
      }

      return accountResult
    } catch (error) {
      console.error(`Error updating account ${id}:`, error)
      throw error
    }
  }

  /**
   * Agregar transacción a cuenta
   */
  async addTransaction(accountId: string, transactionData: AddTransactionData): Promise<{
    transaction: Transaction
    account: Partial<AccountPayable>
    summary: AccountSummary
  }> {
    if (!accountId || !transactionData?.type || !transactionData?.amount) {
      throw new Error('Parámetros inválidos para agregar transacción')
    }

    try {
      const response = await api.post(`/accounts-payable/${accountId}/transactions`, transactionData)
      const responseData = validateResponse(response, 'agregar transacción')

      return (responseData as {
        transaction: Transaction
        account: Partial<AccountPayable>
        summary: AccountSummary
      })
    } catch (error) {
      console.error(`Error adding transaction to account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Obtener estado de cuenta detallado
   */
  async getAccountStatement(accountId: string, filters: StatementFilters = {}): Promise<{
    account: Partial<AccountPayable>
    transactions: Transaction[]
    periodTotals: {
      sales: number
      payments: number
      adjustments: number
      interests: number
    }
    summary: AccountSummary
    meta: {
      total: number
      page: number
      pageSize: number
      totalPages: number
    }
  }> {
    if (!accountId) {
      throw new Error('ID de cuenta requerido')
    }

    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await api.get(`/accounts-payable/${accountId}/statement?${params.toString()}`)
      const responseData = validateResponse(response, 'obtener estado de cuenta')

      return (responseData as {
        account: Partial<AccountPayable>
        transactions: Transaction[]
        periodTotals: {
          sales: number
          payments: number
          adjustments: number
          interests: number
        }
        summary: AccountSummary
        meta: {
          total: number
          page: number
          pageSize: number
          totalPages: number
        }
      })
    } catch (error) {
      console.error(`Error fetching statement for account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Buscar cuenta por número de documento
   */
  async getAccountByDocument(documentNumber: string): Promise<AccountPayable> {
    const normalizedDocumentNumber = typeof documentNumber === 'string'
      ? documentNumber.trim()
      : ''

    if (!normalizedDocumentNumber) {
      throw new Error('Número de documento inválido')
    }

    try {
      const response = await api.get(`/accounts-payable/search/by-document/${encodeURIComponent(normalizedDocumentNumber)}`)
      const responseData = validateResponse(response, 'buscar cuenta por documento')

      const accountData = (responseData as { data?: AccountPayable }).data

      if (!accountData) {
        throw new Error('Cuenta no encontrada')
      }

      return accountData
    } catch (error) {
      console.error(`Error searching account by document ${documentNumber}:`, error)
      throw error
    }
  }

  /**
   * Verificar disponibilidad de crédito
   */
  async checkCreditAvailability(accountId: string, amount: number): Promise<CreditCheckResult> {
    if (!accountId || typeof amount !== 'number' || amount <= 0) {
      throw new Error('Parámetros inválidos para verificar crédito')
    }

    try {
      const response = await api.post(`/accounts-payable/${accountId}/check-credit`, { amount })
      const responseData = validateResponse(response, 'verificar crédito')

      return (responseData as { data: CreditCheckResult }).data
    } catch (error) {
      console.error(`Error checking credit for account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Calcular y aplicar intereses por mora
   */
  async calculateInterest(accountId: string, forceCalculation = false): Promise<{
    interestApplied: number
    transaction: Transaction
    account: Partial<AccountPayable>
    summary: AccountSummary
  }> {
    if (!accountId) {
      throw new Error('ID de cuenta requerido')
    }

    try {
      const response = await api.post(`/accounts-payable/${accountId}/calculate-interest`, { forceCalculation })
      const responseData = validateResponse(response, 'calcular intereses')

      return (responseData as {
        interestApplied: number
        transaction: Transaction
        account: Partial<AccountPayable>
        summary: AccountSummary
      })
    } catch (error) {
      console.error(`Error calculating interest for account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Registrar venta en cuenta corriente
   */
  async registerSaleToAccount(accountId: string, saleData: {
    saleId?: string
    amount: number
    description: string
    invoice?: {
      number?: string
      type?: string
      date?: string
    }
    items?: Array<{
      productId: string
      productName: string
      productCode?: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
  }): Promise<{
    saleRegistered: boolean
    transaction: Transaction
    account: {
      id: string
      newBalance: number
      availableCredit: number
    }
    summary: AccountSummary
  }> {
    if (!accountId || !saleData?.amount || typeof saleData.amount !== 'number') {
      throw new Error('Parámetros inválidos para registrar venta')
    }

    try {
      const response = await api.post(`/accounts-payable/${accountId}/sales`, saleData)
      const responseData = validateResponse(response, 'registrar venta')

      return (responseData as {
        data: {
          saleRegistered: boolean
          transaction: Transaction
          account: {
            id: string
            newBalance: number
            availableCredit: number
          }
          summary: AccountSummary
        }
      }).data
    } catch (error) {
      console.error(`Error registering sale to account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Registrar venta en cuenta corriente con reversión automática de caja
   */
  async registerSaleToAccountWithCashReversal(accountId: string, saleData: {
    saleId?: string
    amount: number
    description: string
    invoice?: {
      number?: string
      type?: string
      date?: string
    }
    items?: Array<{
      productId: string
      productName: string
      productCode?: string
      quantity: number
      unitPrice: number
      subtotal: number
    }>
    revertCashMovements?: boolean
  }): Promise<{
    saleRegistered: boolean
    transaction: Transaction
    account: {
      id: string
      newBalance: number
      availableCredit: number
    }
    summary: AccountSummary
    cashReversalInfo?: {
      cashRegisterId?: string
      reversedAmount?: number
      reversedPayments?: Array<{
        method: string
        amount: number
      }>
      warning?: string
      reason?: string
      manualActionRequired?: boolean
      suggestedAction?: string
    }
  }> {
    if (!accountId || !saleData?.amount || typeof saleData.amount !== 'number') {
      throw new Error('Parámetros inválidos para registrar venta')
    }

    try {
      const requestData = {
        ...saleData,
        revertCashMovements: saleData.revertCashMovements ?? true
      }

      const response = await api.post(`/accounts-payable/${accountId}/sales`, requestData)
      const responseData = validateResponse(response, 'registrar venta con reversión')

      return (responseData as {
        data: {
          saleRegistered: boolean
          transaction: Transaction
          account: {
            id: string
            newBalance: number
            availableCredit: number
          }
          summary: AccountSummary
          cashReversalInfo?: {
            cashRegisterId?: string
            reversedAmount?: number
            reversedPayments?: Array<{
              method: string
              amount: number
            }>
            warning?: string
            reason?: string
            manualActionRequired?: boolean
            suggestedAction?: string
          }
        }
      }).data
    } catch (error) {
      console.error(`Error registering sale to account with cash reversal ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Registrar pago en cuenta corriente
   */
  async registerPaymentToAccount(accountId: string, paymentData: {
    amount: number
    method: string
    reference?: string
    description?: string
    notes?: string
  }): Promise<{
    paymentRegistered: boolean
    transaction: Transaction
    account: {
      id: string
      newBalance: number
      overdueAmount: number
    }
    paidAmount: number
    summary: AccountSummary
  }> {
    if (!accountId || !paymentData?.amount || typeof paymentData.amount !== 'number' || !paymentData.method) {
      throw new Error('Parámetros inválidos para registrar pago')
    }

    try {
      const response = await api.post(`/accounts-payable/${accountId}/payments`, paymentData)
      const responseData = validateResponse(response, 'registrar pago')

      return (responseData as {
        data: {
          paymentRegistered: boolean
          transaction: Transaction
          account: {
            id: string
            newBalance: number
            overdueAmount: number
          }
          paidAmount: number
          summary: AccountSummary
        }
      }).data
    } catch (error) {
      console.error(`Error registering payment to account ${accountId}:`, error)
      throw error
    }
  }

  /**
   * Registrar venta existente en cuenta corriente
   */
  async registerExistingSaleToAccount(saleId: string, data: {
    accountId?: string
    createAccount?: boolean
    customerData?: Customer
  }): Promise<{
    saleRegistered: boolean
    sale: {
      id: string
      invoiceNumber?: string
      invoiceType?: string
      total: number
    }
    transaction: Transaction
    account: {
      id: string
      customerName: string
      newBalance: number
      availableCredit: number
    }
    summary: AccountSummary
  }> {
    if (!saleId) {
      throw new Error('ID de venta requerido')
    }

    if (!data.accountId && !(data.createAccount && data.customerData)) {
      throw new Error('Debe proporcionar un accountId o customerData con createAccount=true')
    }

    try {
      const response = await api.post(`/accounts-payable/sales/from-sale/${saleId}`, data)
      const responseData = validateResponse(response, 'registrar venta existente')

      return (responseData as {
        data: {
          saleRegistered: boolean
          sale: {
            id: string
            invoiceNumber?: string
            invoiceType?: string
            total: number
          }
          transaction: Transaction
          account: {
            id: string
            customerName: string
            newBalance: number
            availableCredit: number
          }
          summary: AccountSummary
        }
      }).data
    } catch (error) {
      console.error(`Error registering existing sale ${saleId}:`, error)
      throw error
    }
  }

  /**
   * Obtener reporte de deudores
   */
  async getDebtorsReport(filters: { status?: string; hasOverdue?: boolean } = {}): Promise<DebtorsReportData> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await api.get(`/accounts-payable/reports/debtors?${params.toString()}`)
      const responseData = validateResponse(response, 'obtener reporte de deudores')

      // Asegurar estructura válida del reporte
      const reportData = responseData as { data?: { accounts?: AccountPayable[]; summary?: { totalDebt?: number; accountCount?: number; averageDebt?: number } } }

      return {
        accounts: Array.isArray(reportData.data?.accounts) ? reportData.data.accounts : [],
        summary: {
          totalDebt: Number(reportData.data?.summary?.totalDebt) || 0,
          accountCount: Number(reportData.data?.summary?.accountCount) || 0,
          averageDebt: Number(reportData.data?.summary?.averageDebt) || 0
        }
      }
    } catch (error) {
      console.error('Error fetching debtors report:', error)
      // Retornar estructura válida en caso de error
      return {
        accounts: [],
        summary: {
          totalDebt: 0,
          accountCount: 0,
          averageDebt: 0
        }
      }
    }
  }

  /**
   * Procesar vencimientos masivos
   */
  async processOverdueAccounts(): Promise<ProcessOverdueResult> {
    try {
      const response = await api.post('/accounts-payable/maintenance/process-overdue')
      const responseData = validateResponse(response, 'procesar vencimientos')

      const processData = responseData as { data?: { processedAccounts?: number; newOverdueAccounts?: number; totalOverdueAmount?: number; timestamp?: string } }

      // Asegurar estructura válida del resultado
      return {
        processedAccounts: Number(processData.data?.processedAccounts) || 0,
        newOverdueAccounts: Number(processData.data?.newOverdueAccounts) || 0,
        totalOverdueAmount: Number(processData.data?.totalOverdueAmount) || 0,
        timestamp: processData.data?.timestamp || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error processing overdue accounts:', error)
      throw error
    }
  }

  /**
   * Cuotas próximas a vencer en todas las cuentas
   */
  async getUpcomingInstallments(days = 7): Promise<{
    data: UpcomingInstallment[]
    meta: { count: number; days: number }
  }> {
    const response = await api.get(`/accounts-payable/installments/upcoming?days=${days}`)
    return response.data
  }

  /**
   * Cuotas vencidas en todas las cuentas
   */
  async getOverdueInstallments(): Promise<{
    data: OverdueInstallment[]
    meta: { count: number }
  }> {
    const response = await api.get('/accounts-payable/installments/overdue')
    return response.data
  }

  /**
   * Genera mensaje + URL wa.me con las condiciones de una venta
   */
  async getWhatsAppForSale(accountId: string, transactionId: string): Promise<{
    message: string
    url: string
    phone: string | null
  }> {
    const response = await api.get(`/accounts-payable/${accountId}/whatsapp/sale/${transactionId}`)
    return response.data
  }

  /**
   * Genera mensaje + URL wa.me con el saldo y próximas cuotas
   */
  async getWhatsAppForBalance(accountId: string): Promise<{
    message: string
    url: string
    phone: string | null
  }> {
    const response = await api.get(`/accounts-payable/${accountId}/whatsapp/balance`)
    return response.data
  }
}

export const accountsPayableService = new AccountsPayableService()
