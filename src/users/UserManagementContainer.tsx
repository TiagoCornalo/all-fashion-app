import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../services/users'
import { User } from '../types/user.types'
import { UserPlus, Users } from 'lucide-react'
import { LayoutMultiRole } from '../layout'
import {
  CreateUserModal,
  EditUserModal,
  DeleteUserModal,
  UsersTable
} from './components'

const UserManagementContainer = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Consultar los usuarios con React Query
  const {
    data: users,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsEditModalOpen(true)
  }

  const handleDelete = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleRefresh = () => {
    refetch()
  }

  const totalUsers = users?.length || 0
  const activeUsers = users?.filter(user => user.active).length || 0
  const adminUsers = users?.filter(user => user.role === 'ADMIN').length || 0

  return (
    <LayoutMultiRole allowedRoles={['ADMIN']}>
      <div className="p-4 space-y-6">
        {/* Header con estadísticas */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-gray-600">Administra las cuentas de usuario del sistema</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Usuarios</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Usuarios Activos</p>
                    <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Users className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Administradores</p>
                    <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={users || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modales */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        user={selectedUser}
      />
    </LayoutMultiRole>
  )
}

export default UserManagementContainer