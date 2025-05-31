import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  RadioGroup,
  RadioGroupItem,
  Badge
} from '../../components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deactivateUser, deleteUserPermanently } from '../../services/users'
import { User } from '../../types/user.types'
import { toast } from 'react-toastify'
import { UserX, AlertTriangle, Trash, UserMinus } from 'lucide-react'

interface DeleteUserModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

type ActionType = 'deactivate' | 'delete'

const DeleteUserModal = ({ isOpen, onOpenChange, user }: DeleteUserModalProps) => {
  const [actionType, setActionType] = useState<ActionType>('deactivate')
  const queryClient = useQueryClient()

  const deactivateUserMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: (data) => {
      toast.success(data.message || 'Usuario desactivado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al desactivar usuario'
      toast.error(errorMessage)
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserPermanently,
    onSuccess: (data) => {
      toast.success(data.message || 'Usuario eliminado permanentemente')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al eliminar usuario'
      toast.error(errorMessage)
    }
  })

  const handleConfirm = () => {
    if (!user) return

    if (actionType === 'deactivate') {
      deactivateUserMutation.mutate(user._id)
    } else {
      deleteUserMutation.mutate(user._id)
    }
  }

  const handleClose = () => {
    setActionType('deactivate')
    onOpenChange(false)
  }

  const isLoading = deactivateUserMutation.isPending || deleteUserMutation.isPending

  if (!user) return null

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'MANAGER': return 'Gerente'
      case 'SELLER': return 'Vendedor'
      default: return role
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-600" />
            Gestionar Usuario
          </DialogTitle>
          <DialogDescription>
            Selecciona la acción que deseas realizar con este usuario.
          </DialogDescription>
        </DialogHeader>

        {/* Información del usuario */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Usuario:</span>
            <span>{user.name}</span>
            <Badge variant={user.active ? 'success' : 'destructive'}>
              {user.active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Email:</span>
            <span className="text-gray-600">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Rol:</span>
            <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
          </div>
        </div>

        {/* Opciones de acción */}
        <div className="space-y-4">
          <h4 className="font-medium">Selecciona una acción:</h4>

          <RadioGroup
            value={actionType}
            onValueChange={(value) => setActionType(value as ActionType)}
            disabled={isLoading}
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="deactivate" id="deactivate" className="mt-1" />
              <div className="space-y-1 flex-1">
                <label htmlFor="deactivate" className="flex items-center gap-2 cursor-pointer">
                  <UserMinus className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Desactivar Usuario</span>
                </label>
                <p className="text-sm text-gray-600 ml-6">
                  El usuario no podrá acceder al sistema, pero sus datos se conservan.
                  Puede ser reactivado posteriormente.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="delete" id="delete" className="mt-1" />
              <div className="space-y-1 flex-1">
                <label htmlFor="delete" className="flex items-center gap-2 cursor-pointer">
                  <Trash className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-600">Eliminar Permanentemente</span>
                </label>
                <p className="text-sm text-gray-600 ml-6">
                  <strong className="text-red-600">¡PRECAUCIÓN!</strong> Esta acción no se puede deshacer.
                  Todos los datos del usuario se eliminarán permanentemente.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Advertencias específicas */}
        {actionType === 'delete' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">¡Advertencia de Eliminación Permanente!</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Esta acción es irreversible</li>
                  <li>Se perderán todos los datos asociados al usuario</li>
                  <li>No podrás recuperar esta información posteriormente</li>
                  {user.role === 'ADMIN' && (
                    <li className="font-medium">Verifica que no sea el último administrador del sistema</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {actionType === 'deactivate' && user.role === 'ADMIN' && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> Al desactivar un administrador, asegúrate de que
                haya otros administradores activos en el sistema.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant={actionType === 'delete' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={actionType === 'deactivate' ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {isLoading ? (
              actionType === 'delete' ? 'Eliminando...' : 'Desactivando...'
            ) : (
              actionType === 'delete' ? 'Eliminar Permanentemente' : 'Desactivar Usuario'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteUserModal