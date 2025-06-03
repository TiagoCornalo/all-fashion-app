export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'El formato del correo electrónico no es válido'
    }
  }

  const allowedDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com'
  ]
  const domain = email.split('@')[1].toLowerCase()
  if (!allowedDomains.includes(domain)) {
    return { isValid: false, error: 'El correo electrónico no es válido' }
  }

  return { isValid: true, error: '' }
}

export const validatePassword = (password: string) => {
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'La contraseña debe tener al menos 8 caracteres'
    }
  }

  const hasLetters = /[a-zA-Z].*[a-zA-Z]/.test(password)
  if (!hasLetters) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos 2 letras'
    }
  }

  const hasNumber = /\d/.test(password)
  if (!hasNumber) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos 1 número'
    }
  }

  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  if (!hasSpecialChar) {
    return {
      isValid: false,
      error: 'La contraseña debe contener al menos 1 carácter especial'
    }
  }

  return { isValid: true, error: '' }
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount)
}

/**
 * Formatear fecha para mostrar (solo fecha, sin hora)
 * @param date - Fecha a formatear (Date object o string ISO)
 * @returns Fecha formateada en español
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatear fecha y hora para mostrar
 * @param date - Fecha a formatear (Date object o string ISO)
 * @returns Fecha formateada
 */
export const formatDateTime = (date: Date | string): string => {
  if (!date) return ''

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return dateObj.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDayMonth = (date: Date) => {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Tipo para objetos de Mongoose con metadata
 */
interface MongooseObject {
  _doc?: unknown
  userPermissions?: unknown
  [key: string]: unknown
}

/**
 * Extraer datos útiles de objetos de Mongoose que vienen del backend
 * @param mongooseObj - Objeto de Mongoose con metadata
 * @returns Objeto plano con los datos reales
 */
export const extractMongooseData = <T>(mongooseObj: MongooseObject | T): T => {
  if (!mongooseObj) return mongooseObj as T

  // Si el objeto tiene _doc, extraer datos de ahí
  if (mongooseObj && typeof mongooseObj === 'object' && '_doc' in mongooseObj && mongooseObj._doc) {
    return {
      ...mongooseObj._doc as T,
      // Preservar propiedades adicionales que no están en _doc
      ...(mongooseObj.userPermissions && typeof mongooseObj.userPermissions === 'object'
        ? { userPermissions: mongooseObj.userPermissions }
        : {}
      )
    } as T
  }

  // Si no tiene _doc, devolver tal como está
  return mongooseObj as T
}

/**
 * Definir un tipo para manejar errores de API de forma type-safe
 */
export interface ApiError {
  response?: {
    data?: {
      error?: string
      message?: string
    }
  }
  message?: string
}

/**
 * Extraer mensaje de error de forma segura
 * @param error - Error de la API
 * @returns Mensaje de error legible
 */
export const getErrorMessage = (error: ApiError): string => {
  return error.response?.data?.error ||
         error.response?.data?.message ||
         error.message ||
         'Error desconocido'
}
