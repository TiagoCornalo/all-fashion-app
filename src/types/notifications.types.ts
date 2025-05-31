// Tipos para el sistema de notificaciones por rol

export interface OrderNotification {
  orderId: string
  supplier: string
  itemCount: number
  message: string
  priority: 'normal' | 'high' | 'critical'
  timestamp: Date
  adminContext?: boolean
}

export interface VerificationNotification extends OrderNotification {
  allCorrect: boolean
  issuesCount?: number
  verifiedBy: string
  verificationDate: Date
  requiresAction?: boolean
}

export interface AdminAlert {
  event: string
  message: string
  priority: 'normal' | 'high' | 'critical'
  targetRole: 'ADMIN'
  timestamp: Date
  requiresAction?: boolean
  sound?: boolean
  persistent?: boolean
}

export interface ManagerAlert {
  event: string
  message: string
  priority: 'normal' | 'high'
  targetRole: 'MANAGER'
  timestamp: Date
  requiresAction?: boolean
}

export interface StaffNotification {
  event: string
  message: string
  priority: 'normal'
  targetRole: 'STAFF'
  timestamp: Date
}

export interface UserNotification {
  userId: string
  event: 'arrivalConfirmed' | 'verificationCompleted' | 'orderScheduledConfirmation' | string
  message: string
  timestamp: Date
  allCorrect?: boolean
  [key: string]: string | boolean | Date | undefined
}

export interface ScheduledOrdersUpdate {
  totalScheduledToday: number
  orders: Array<{
    _id: string
    supplier: string
    itemCount: number
    scheduledArrivalDate?: Date
    receptionStatus: string
  }>
  timestamp: Date
  date: string
}

export interface OrderStats {
  today: {
    scheduledArrivals: number
    physicalArrivals: number
    verified: number
  }
  pending: {
    waitingVerification: number
    adminApproval: number
  }
  timestamp: Date
  date: string
  userRole?: string
  isSimplified?: boolean
}

// Nuevos tipos específicos para cada evento del backend
export interface OrderScheduledTodayData extends OrderNotification {}

export interface OrderArrivedPhysicallyData extends OrderNotification {
  adminContext?: boolean
}

export interface OrderVerifiedByEmployeeData extends VerificationNotification {
  priority: 'normal' | 'high'
  requiresAction?: boolean
}

export interface AdminAlertData {
  event: string
  message: string
  priority: 'normal' | 'high' | 'critical'
  requiresAction?: boolean
  sound?: boolean
  persistent?: boolean
  timestamp?: Date
}

export interface ManagerAlertData {
  event: string
  message: string
  priority: 'normal' | 'high'
  requiresAction?: boolean
  timestamp?: Date
}

export interface StaffNotificationData {
  event: string
  message: string
  timestamp?: Date
}

export interface UserSpecificNotificationData {
  userId: string
  event: string
  message: string
  timestamp?: Date
  allCorrect?: boolean
  [key: string]: string | boolean | Date | undefined
}

// Tipo unión para todos los datos de notificación
export type NotificationData =
  | OrderScheduledTodayData
  | OrderArrivedPhysicallyData
  | OrderVerifiedByEmployeeData
  | AdminAlertData
  | ManagerAlertData
  | StaffNotificationData
  | UserSpecificNotificationData
  | OrderStats
  | ScheduledOrdersUpdate

export type UserRole = 'ADMIN' | 'MANAGER' | 'SELLER'

export interface SocketUser {
  userId: string
  userRole: UserRole
  userName: string
}

export interface NotificationConfig {
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'
  autoClose?: number | false
  closeOnClick?: boolean
  sound?: boolean
  persistent?: boolean
  className?: string
}