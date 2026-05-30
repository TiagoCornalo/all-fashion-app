import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Switch,
  Separator
} from '../../components'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUser } from '../../services/users'
import { User, UpdateUser, UserRole } from '../../types/user.types'
import { toast } from 'react-toastify'
import { UserCog, Eye, EyeOff, AlertTriangle } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido').min(1, 'El email es requerido'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum(['ADMIN', 'SELLER', 'MANAGER', 'TECHNICIAN']),
  active: z.boolean()
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) {
      return false
    }
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "Las contraseñas no coinciden o la contraseña es muy corta (mínimo 6 caracteres)",
  path: ["confirmPassword"]
})

type FormValues = z.infer<typeof formSchema>

interface EditUserModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

const EditUserModal = ({ isOpen, onOpenChange, user }: EditUserModalProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'SELLER',
      active: true
    }
  })

  // Resetear y cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        active: user.active
      })
      setChangePassword(false)
    }
  }, [user, isOpen, form])

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUser }) => updateUser(id, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Usuario actualizado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al actualizar usuario'
      toast.error(errorMessage)
    }
  })

  const onSubmit = (values: FormValues) => {
    if (!user) return

    const updateData: UpdateUser = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role as UserRole,
      active: values.active
    }

    // Solo incluir password si se está cambiando
    if (changePassword && values.password) {
      updateData.password = values.password
    }

    updateUserMutation.mutate({ id: user._id, data: updateData })
  }

  const handleClose = () => {
    form.reset()
    setChangePassword(false)
    onOpenChange(false)
  }

  const handleChangePasswordToggle = (checked: boolean) => {
    setChangePassword(checked)
    if (!checked) {
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario. Los campos vacíos no se actualizarán.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      disabled={updateUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="usuario@empresa.com"
                      disabled={updateUserMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={updateUserMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SELLER">Vendedor</SelectItem>
                      <SelectItem value="TECHNICIAN">Técnico</SelectItem>
                      <SelectItem value="MANAGER">Gerente</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El usuario puede acceder al sistema
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={updateUserMutation.isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            {/* Sección de cambio de contraseña */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="change-password"
                  checked={changePassword}
                  onCheckedChange={handleChangePasswordToggle}
                  disabled={updateUserMutation.isPending}
                />
                <label htmlFor="change-password" className="text-sm font-medium">
                  Cambiar contraseña
                </label>
              </div>

              {changePassword && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={updateUserMutation.isPending}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={updateUserMutation.isPending}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              disabled={updateUserMutation.isPending}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={updateUserMutation.isPending}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        <strong>Advertencia:</strong> El usuario deberá usar la nueva contraseña
                        en su próximo inicio de sesión.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserModal
