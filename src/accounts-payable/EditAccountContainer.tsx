import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutMultiRole } from '../layout'
import { AlertTriangle, CreditCard } from 'lucide-react'
import { accountsPayableService, AccountPayable } from '../services/accountsPayable.service'
import { useAuth } from '../context/auth/useAuth'
import { EditAccountForm } from './components/forms/'

/**
 * Contenedor para editar una cuenta corriente
 */
const EditAccountContainer = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Convertir role a string para la comparación
  const userRole = user?.role as string
  const isAdmin = userRole === 'ADMIN'

  // Query para obtener los detalles de la cuenta
  const {
    data: account,
    isLoading,
    error,
    refetch
  } = useQuery<AccountPayable, Error>({
    queryKey: ['account-detail', id],
    queryFn: () => {
      if (!id) throw new Error('ID de cuenta requerido')
      return accountsPayableService.getAccountById(id)
    },
    enabled: !!id && isAdmin,
    retry: 2,
    retryDelay: 1000
  })

  if (!isAdmin) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN']} showGoBackButton={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              Solo administradores pueden editar cuentas corrientes
            </p>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  if (error) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN']} showGoBackButton={true}>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96 bg-red-50 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error al cargar la cuenta
              </h3>
              <p className="text-gray-600 mb-4">
                {error.message || 'Error desconocido'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  if (!account && !isLoading) {
    return (
      <LayoutMultiRole allowedRoles={['ADMIN']} showGoBackButton={true}>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cuenta no encontrada
              </h3>
              <p className="text-gray-600">
                La cuenta solicitada no existe o no tienes permisos para editarla
              </p>
            </div>
          </div>
        </div>
      </LayoutMultiRole>
    )
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN']} showGoBackButton={true}>
      {isLoading && (
        <div className="p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cargando cuenta...
              </h3>
              <p className="text-gray-600">
                Obteniendo información de la cuenta
              </p>
            </div>
          </div>
        </div>
      )}

      {account && !isLoading && (
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Cuenta Corriente
            </h1>
            <p className="text-gray-600">
              Cliente: {account.customer.name} ({account.customer.documentType}: {account.customer.documentNumber})
            </p>
          </div>

          {/* Formulario de edición */}
          <div className="bg-white rounded-lg">
            <EditAccountForm
              account={account}
              onSuccess={() => {
                navigate(`/accounts-payable/${id}`)
              }}
              onCancel={() => {
                navigate(`/accounts-payable/${id}`)
              }}
            />
          </div>
        </div>
      )}
    </LayoutMultiRole>
  )
}

export default EditAccountContainer