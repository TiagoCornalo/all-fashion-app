export type ServiceStatus =
  | 'RECEIVED'
  | 'DIAGNOSING'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'WAITING_PARTS'
  | 'IN_REPAIR'
  | 'TESTING'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'WARRANTY_CLAIM'

export type ServicePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export type EquipmentType =
  | 'CLIPPER'
  | 'TRIMMER'
  | 'SHAVER'
  | 'DRYER'
  | 'STERILIZER'
  | 'CHAIR'
  | 'OTHER'

export type DocumentType = 'DNI' | 'CUIT' | 'OTHER'

export type PaymentMethod = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER' | 'MP'

export type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'

export type Frequency = 'ALWAYS' | 'SOMETIMES' | 'RARELY' | 'ONCE'

export type Repairability = 'REPAIRABLE' | 'NOT_REPAIRABLE' | 'PENDING_EVALUATION'

// Interfaces principales
export interface ServiceCustomer {
  name: string
  documentType: DocumentType
  documentNumber?: string
  phone: string
  email?: string
  address?: string
}

export interface Equipment {
  type: EquipmentType
  brand: string
  model: string
  serialNumber?: string
  color?: string
  accessories: string[]
  warrantyInfo: {
    hasWarranty: boolean
    warrantyExpires?: Date
    warrantyProvider?: string
  }
}

export interface CustomerReport {
  description: string
  symptoms: string[]
  whenStarted?: string
  frequency: Frequency
  customerNotes?: string
}

export interface TechnicalDiagnosis {
  initialInspection?: string
  diagnosis?: string
  rootCause?: string
  repairability: Repairability
  estimatedRepairTime?: {
    value: number
    unit: TimeUnit
  }
  diagnosedAt?: Date
  diagnosedBy?: string
}

export interface ServicePart {
  _id: string
  product: {
    _id: string
    name: string
    code?: string
    price: number
  }
  quantity: number
  unitPrice: number
  subtotal: number
  addedAt: Date
  addedBy?: string
  notes?: string
}

export interface ServiceCosts {
  laborCost: number
  partsCost: number
  additionalCosts: number
  totalCost: number
  estimatedCost: number
  customerApprovedAmount?: number
}

export interface ServiceDates {
  receivedAt: Date
  diagnosisCompletedAt?: Date
  approvedAt?: Date
  repairStartedAt?: Date
  repairCompletedAt?: Date
  deliveredAt?: Date
  estimatedDelivery?: Date
}

export interface ServiceNotes {
  technicalNotes?: string
  customerInstructions?: string
  internalNotes?: string
  deliveryNotes?: string
}

export interface ServicePayment {
  isPaid: boolean
  paymentMethod?: PaymentMethod
  paidAmount: number
  paidAt?: Date
  receivedBy?: string
}

export interface StatusChange {
  _id: string
  status: ServiceStatus
  changedAt: Date
  changedBy: string
  notes?: string
}

export interface ServiceWarranty {
  warrantyDays: number
  warrantyExpires?: Date
  warrantyConditions?: string
}

export interface TemplateInfo {
  templateId?: string
  templateName?: string
  templateVersion?: string
  templateCode?: string
  createdFromTemplate: boolean
}

export interface ServiceSummary {
  serviceNumber: string
  customerName: string
  equipmentInfo: string
  status: ServiceStatus
  priority: ServicePriority
  daysSinceReceived: number
  isOverdue: boolean
  daysOverdue: number
  totalCost: number
  isPaid: boolean
  hasWarranty: boolean
  assignedTechnician?: string
  partsCount: number
  estimatedDelivery?: Date
  lastStatusChange: Date
}

export interface TechnicalService {
  _id: string
  serviceNumber: string
  customer: ServiceCustomer
  equipment: Equipment
  customerReport: CustomerReport
  technicalDiagnosis: TechnicalDiagnosis
  status: ServiceStatus
  priority: ServicePriority
  partsUsed: ServicePart[]
  costs: ServiceCosts
  dates: ServiceDates
  assignedTechnician?: {
    _id: string
    name: string
  }
  notes: ServiceNotes
  payment: ServicePayment
  templateInfo?: TemplateInfo
  statusHistory: StatusChange[]
  serviceWarranty: ServiceWarranty
  createdBy: string
  createdAt: Date
  updatedAt: Date
  summary?: ServiceSummary
}

// DTOs para creación y actualización
export interface CreateTechnicalServiceDto {
  customer: ServiceCustomer
  equipment: Equipment
  customerReport: CustomerReport
  assignedTechnician?: string
  priority?: ServicePriority
  estimatedDelivery?: Date
  notes?: Partial<ServiceNotes>
  generateNumber?: boolean
  serviceNumber?: string
}

export interface UpdateTechnicalServiceDto {
  customer?: Partial<ServiceCustomer>
  equipment?: Partial<Equipment>
  customerReport?: Partial<CustomerReport>
  technicalDiagnosis?: Partial<TechnicalDiagnosis>
  assignedTechnician?: string
  priority?: ServicePriority
  estimatedDelivery?: Date
  notes?: Partial<ServiceNotes>
  costs?: Partial<ServiceCosts>
}

export interface StatusChangeDto {
  newStatus: ServiceStatus
  notes?: string
}

export interface AddPartDto {
  productId: string
  quantity?: number
  unitPrice?: number
  notes?: string
}

export interface RegisterPaymentDto {
  paymentMethod: PaymentMethod
  amount: number
  notes?: string
}

// Filtros para búsqueda
export interface TechnicalServiceFilters {
  page?: number
  pageSize?: number
  search?: string
  status?: ServiceStatus | ServiceStatus[]
  priority?: ServicePriority
  equipmentType?: EquipmentType
  assignedTechnician?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  customerPhone?: string
  isPaid?: boolean
  isOverdue?: boolean
}

// Dashboard stats
export interface ServiceDashboardStats {
  overview: {
    totalServices: number
    activeServices: number
    completedToday: number
    overdueServices: number
    completionRate: string
  }
  breakdown: {
    byStatus: Record<ServiceStatus, number>
    byPriority: Record<ServicePriority, number>
  }
  revenue: {
    thisMonth: number
    paidServicesCount: number
  }
  recentActivity: Array<{
    _id: string
    serviceNumber: string
    customer: { name: string }
    equipment: { brand: string; model: string }
    status: ServiceStatus
    createdAt: Date
    assignedTechnician?: { name: string }
  }>
  topTechnicians: Array<{
    technicianId: string
    technicianName: string
    completedServices: number
    totalRevenue: number
    avgCompletionDays: number | null
  }>
  generatedAt: Date
}

// Service Templates
export type ServiceCategory =
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'CLEANING'
  | 'BLADE_SERVICE'
  | 'MOTOR_SERVICE'
  | 'ELECTRICAL'
  | 'CALIBRATION'
  | 'WARRANTY'
  | 'OTHER'

export interface TemplateProcedure {
  _id?: string
  stepNumber: number
  title: string
  description: string
  estimatedTime?: {
    value: number
    unit: TimeUnit
  }
  requiresApproval?: boolean
  isOptional?: boolean
}

export interface TemplateCommonPart {
  _id?: string
  product: {
    _id: string
    name: string
    code?: string
    price: number
    stock: number
  }
  quantity: number
  isOptional: boolean
  description?: string
}

export interface TemplatePricing {
  basePrice: number
  minPrice?: number
  maxPrice?: number
  currency: string
  priceValidUntil?: Date
}

export interface TemplateRestrictions {
  requiredRole?: string
  specificUsers: string[]
}

export interface ServiceTemplate {
  _id: string
  name: string
  code: string
  description: string
  category: ServiceCategory
  version: string
  applicableEquipmentTypes: EquipmentType[]
  applicableBrands: string[]
  pricing: TemplatePricing
  estimatedTime: {
    min: number
    max: number
    unit: TimeUnit
  }
  procedures: TemplateProcedure[]
  commonParts: TemplateCommonPart[]
  defaultPriority: ServicePriority
  warrantyInfo: {
    warrantyDays: number
    warrantyConditions?: string
  }
  diagnosticInfo: {
    requiresDiagnosis: boolean
    diagnosticQuestions?: Array<{
      question: string
      type: 'YES_NO' | 'TEXT' | 'MULTIPLE_CHOICE'
      required: boolean
      options?: string[]
    }>
  }
  defaultNotes: {
    customerInstructions?: string
    technicalNotes?: string
    internalNotes?: string
  }
  statistics: {
    timesUsed: number
    averageCompletionTime: number
    successRate: number
    averageCustomerSatisfaction: number
  }
  isActive: boolean
  isPublic: boolean
  restrictions: TemplateRestrictions
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastModifiedBy?: string
  changelog: Array<{
    version: string
    changes: string
    changedBy: string
    changedAt: Date
  }>
}

export interface CreateServiceTemplateDto {
  name: string
  description: string
  category: ServiceCategory
  applicableEquipmentTypes: EquipmentType[]
  applicableBrands?: string[]
  pricing: TemplatePricing
  estimatedTime: {
    min: number
    max: number
    unit: TimeUnit
  }
  procedures?: TemplateProcedure[]
  commonParts?: TemplateCommonPart[]
  defaultPriority?: ServicePriority
  warrantyInfo?: {
    warrantyDays: number
    warrantyConditions?: string
  }
  diagnosticInfo?: {
    requiresDiagnosis: boolean
    diagnosticQuestions?: Array<{
      question: string
      type: 'YES_NO' | 'TEXT' | 'MULTIPLE_CHOICE'
      required: boolean
      options?: string[]
    }>
  }
  defaultNotes?: {
    customerInstructions?: string
    technicalNotes?: string
    internalNotes?: string
  }
  isActive?: boolean
  isPublic?: boolean
  restrictions?: TemplateRestrictions
  generateCode?: boolean
  code?: string
}

export interface UpdateServiceTemplateDto extends Partial<CreateServiceTemplateDto> {
  updateVersion?: boolean
}

export interface ServiceTemplateFilters {
  page?: number
  pageSize?: number
  search?: string
  category?: ServiceCategory
  equipmentType?: EquipmentType
  isActive?: boolean
  isPublic?: boolean
  brand?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  priceMin?: number
  priceMax?: number
  showOnlyUsable?: boolean
}

export interface CreateFromTemplateDto {
  templateId: string
  customer: ServiceCustomer
  equipment: Equipment
  customizations?: {
    assignedTechnician?: string
    laborCost?: number
    estimatedCost?: number
    serviceNumber?: string
    includeOptionalParts?: boolean
  }
  generateNumber?: boolean
  includeCommonParts?: boolean
}

// Response types
export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    appliedFilters?: Record<string, unknown>
    summary?: Record<string, unknown>
  }
  success: boolean
  message?: string
}