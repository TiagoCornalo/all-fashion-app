import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input
} from '../../components'
import { User } from '../../types/user.types'
import { formatDateTime } from '../../utils'
import { MoreHorizontal, Pencil, UserX, Search } from 'lucide-react'
import { useState } from 'react'

interface UsersTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  isLoading?: boolean
}

const UsersTable = ({ users, onEdit, onDelete, isLoading = false }: UsersTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users

    const search = searchTerm.toLowerCase()
    return users.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    )
  }, [users, searchTerm])

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'MANAGER': return 'Gerente'
      case 'SELLER': return 'Vendedor'
      case 'TECHNICIAN': return 'Técnico'
      default: return role
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'MANAGER': return 'default'
      case 'SELLER': return 'secondary'
      case 'TECHNICIAN': return 'outline'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuarios..."
            className="pl-10"
            disabled
          />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500">Cargando usuarios...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar usuarios por nombre, email o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-center">
                    <p className="text-gray-500">
                      {searchTerm ? 'No se encontraron usuarios con esos criterios' : 'No hay usuarios registrados'}
                    </p>
                    {searchTerm && (
                      <p className="text-sm text-gray-400 mt-1">
                        Intenta cambiar los términos de búsqueda
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-600">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'success' : 'destructive'}>
                      {user.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {formatDateTime(new Date(user.createdAt))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          className="text-red-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Gestionar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Información de resultados */}
      {searchTerm && filteredUsers.length > 0 && (
        <div className="text-sm text-gray-600">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      )}
    </div>
  )
}

export default UsersTable
