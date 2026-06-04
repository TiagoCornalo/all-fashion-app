import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Loader } from './ui/Loader'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary para manejar errores de suspensión y otros errores de React
 * Especialmente útil para componentes lazy-loaded que pueden causar suspensión
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error('Error caught by ErrorBoundary:', error)

    // Si es un error de suspensión, no lo tratamos como error fatal
    if (error.message?.includes('suspended while responding to synchronous input')) {
      console.log('Handling suspension error gracefully')
      return {
        hasError: false, // No tratarlo como error
        error: null
      }
    }

    return {
      hasError: true,
      error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error details:', error, errorInfo)

    // Si es un error de suspensión, intentar recuperarse
    if (error.message?.includes('suspended while responding to synchronous input')) {
      console.log('Attempting to recover from suspension error')
      setTimeout(() => {
        this.setState({ hasError: false, error: null })
      }, 100)
    }
  }

  public render() {
    if (this.state.hasError) {
      // Mostrar fallback personalizado o por defecto
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Algo salió mal
              </h1>
              <p className="text-gray-600 mb-4">
                Se produjo un error inesperado. Por favor, recarga la página.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * HOC para envolver componentes con Error Boundary
 */
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

/**
 * Error Boundary específico para componentes lazy con Suspense
 */
export const SuspenseErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-white p-4'>
          <div className='w-full max-w-md rounded-lg border bg-white p-6 text-center shadow-lg'>
            <h1 className='mb-2 text-xl font-semibold text-gray-900'>
              No se pudo cargar esta pantalla
            </h1>
            <p className='mb-4 text-sm text-gray-600'>
              Actualizá la página. Si vuelve a pasar, cerrá sesión e ingresá nuevamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              Recargar
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
